import { cleanupUploadedFile } from "./storageCleanup";

export function inferMemoryType(fileType = "") {
  if (fileType.startsWith("image/")) return "photo";
  if (fileType.startsWith("audio/")) return "audio";
  if (fileType.startsWith("video/")) return "video";
  if (fileType.includes("pdf") || fileType.includes("document")) return "document";
  return "mixed";
}

export function getSafeFileName(name = "memory") {
  return String(name || "memory").replace(/[^a-zA-Z0-9.\-_]/g, "-");
}

const MANAGE_ROLES = ["owner", "admin", "manager"];
const UPLOAD_ROLES = [...MANAGE_ROLES, "contributor"];

function normalizeRole(role = "") {
  return String(role || "").toLowerCase();
}

function isUsableVaultRow(vault) {
  return Boolean(vault?.id) && vault.is_archived !== true;
}

function withRequiredVaultColumns(columns = "") {
  if (!columns || columns.trim() === "*") return columns || "*";

  const requiredColumns = ["id", "network_id", "created_by", "is_archived", "created_at"];
  const existing = new Set(
    columns
      .split(",")
      .map((column) => column.trim().split(":").pop().split(" ").pop())
      .filter(Boolean)
  );
  const missing = requiredColumns.filter((column) => !existing.has(column));

  return [...missing, columns].join(", ");
}

export function canManageRole(role) {
  return MANAGE_ROLES.includes(normalizeRole(role));
}

export function canUploadRole(role) {
  return UPLOAD_ROLES.includes(normalizeRole(role));
}

export async function getVaultAccess(supabase, user, vaultDataOrId) {
  if (!user?.id || !vaultDataOrId) {
    return { canView: false, canManage: false, canUpload: false, role: "" };
  }

  const vaultData =
    typeof vaultDataOrId === "string"
      ? (
          await supabase
            .from("vaults")
            .select("id, network_id, created_by")
            .eq("id", vaultDataOrId)
            .maybeSingle()
        ).data
      : vaultDataOrId;

  if (!vaultData?.id) {
    return { canView: false, canManage: false, canUpload: false, role: "" };
  }

  if (vaultData.created_by === user.id) {
    return { canView: true, canManage: true, canUpload: true, role: "owner" };
  }

  const { data: vaultMember } = await supabase
    .from("vault_memberships")
    .select("role")
    .eq("vault_id", vaultData.id)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (vaultMember) {
    const role = normalizeRole(vaultMember.role || "viewer");
    return {
      canView: true,
      canManage: canManageRole(role),
      canUpload: canUploadRole(role),
      role,
    };
  }

  if (!vaultData.network_id) {
    return { canView: false, canManage: false, canUpload: false, role: "" };
  }

  const { data: networkMember } = await supabase
    .from("network_members")
    .select("role")
    .eq("network_id", vaultData.network_id)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!networkMember) {
    return { canView: false, canManage: false, canUpload: false, role: "" };
  }

  const role = normalizeRole(networkMember.role || "viewer");
  return {
    canView: true,
    canManage: canManageRole(role),
    canUpload: canUploadRole(role),
    role,
  };
}

export async function getNetworkAccess(supabase, user, networkId) {
  if (!user?.id || !networkId) {
    return { canView: false, canManage: false, canUpload: false, role: "" };
  }

  const { data: member } = await supabase
    .from("network_members")
    .select("role")
    .eq("network_id", networkId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member) {
    return { canView: false, canManage: false, canUpload: false, role: "" };
  }

  const role = normalizeRole(member.role || "viewer");
  return {
    canView: true,
    canManage: canManageRole(role),
    canUpload: canUploadRole(role),
    role,
  };
}

export async function loadAccessibleVaults(supabase, user, selectColumns) {
  if (!user?.id) return [];

  const columns = withRequiredVaultColumns(
    selectColumns ||
      "id, network_id, created_by, title, subject_name, relationship_label, description, created_at, is_archived"
  );

  const [ownedResult, vaultMembershipsResult, networkMembershipsResult] = await Promise.all([
    supabase
      .from("vaults")
      .select(columns)
      .eq("created_by", user.id)
      .or("is_archived.is.null,is_archived.eq.false")
      .order("created_at", { ascending: false }),
    supabase
      .from("vault_memberships")
      .select("vault_id")
      .eq("user_id", user.id),
    supabase
      .from("network_members")
      .select("network_id")
      .eq("user_id", user.id),
  ]);

  if (ownedResult.error) {
    throw new Error(ownedResult.error.message);
  }

  const memberVaultIds = [
    ...new Set((vaultMembershipsResult.data || []).map((row) => row.vault_id).filter(Boolean)),
  ];
  const networkIds = [
    ...new Set((networkMembershipsResult.data || []).map((row) => row.network_id).filter(Boolean)),
  ];

  const [memberVaultsResult, networkVaultsResult] = await Promise.all([
    memberVaultIds.length > 0
      ? supabase
          .from("vaults")
          .select(columns)
          .in("id", memberVaultIds)
          .or("is_archived.is.null,is_archived.eq.false")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    networkIds.length > 0
      ? supabase
          .from("vaults")
          .select(columns)
          .in("network_id", networkIds)
          .or("is_archived.is.null,is_archived.eq.false")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  if (memberVaultsResult.error) {
    throw new Error(memberVaultsResult.error.message);
  }

  if (networkVaultsResult.error) {
    throw new Error(networkVaultsResult.error.message);
  }

  const vaultMap = new Map();
  [
    ...(ownedResult.data || []),
    ...(memberVaultsResult.data || []),
    ...(networkVaultsResult.data || []),
  ].forEach((vault) => {
    if (isUsableVaultRow(vault)) vaultMap.set(vault.id, vault);
  });

  const visibleVaults = [];

  for (const vault of vaultMap.values()) {
    const access = await getVaultAccess(supabase, user, vault);
    if (access.canView) {
      visibleVaults.push(vault);
    }
  }

  return visibleVaults.sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}

export async function countAccessibleVaults(supabase, user) {
  const vaults = await loadAccessibleVaults(supabase, user, "id, created_at");
  return vaults.length;
}

function networkLabels(networkType = "family") {
  if (networkType === "friend") {
    return {
      networkDescription: "Private friend network created from the mobile app.",
      relationship: "Friends",
    };
  }

  return {
    networkDescription: "Private family network created from the mobile app.",
    relationship: "Family",
  };
}

export async function loadExistingNetwork(supabase, networkId) {
  if (!networkId) return null;

  const { data, error } = await supabase
    .from("networks")
    .select("id, type")
    .eq("id", networkId)
    .maybeSingle();

  if (error || !data?.id) return null;

  return data;
}

export async function isNetworkMember(supabase, user, networkId) {
  if (!user?.id || !networkId) return false;

  const { data, error } = await supabase
    .from("network_members")
    .select("network_id")
    .eq("network_id", networkId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return !error && Boolean(data?.network_id);
}

async function ensureUsableNetworkForUser({
  supabase,
  user,
  networkId,
  networkType = "family",
}) {
  const existingNetwork = await loadExistingNetwork(supabase, networkId);
  const member = await isNetworkMember(supabase, user, networkId);

  if (existingNetwork?.id && member) {
    return {
      networkId: existingNetwork.id,
      networkType: existingNetwork.type === "friend" ? "friend" : "family",
    };
  }

  throw new Error("You do not have permission to use this vault network.");
}

export async function ensureNetworkAndVaultByType(supabase, user, networkType = "family") {
  if (!user?.id) {
    throw new Error("Please sign in first.");
  }

  throw new Error("Automatic default vault creation is disabled. Create a vault explicitly first.");
}

export async function ensureDefaultNetworkAndVault(supabase, user) {
  if (!user?.id) {
    throw new Error("Please sign in first.");
  }

  throw new Error("Automatic default vault creation is disabled. Create a vault explicitly first.");
}

export async function resolveTargetVault({
  supabase,
  user,
  targetVaultId,
  networkType = "family",
}) {
  if (targetVaultId) {
    const { data, error } = await supabase
      .from("vaults")
      .select("id, network_id, title, subject_name, relationship_label")
      .eq("id", targetVaultId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data?.id && data?.network_id) {
      const access = await getVaultAccess(supabase, user, data);
      if (!access.canUpload) {
        throw new Error("You do not have permission to upload to this vault.");
      }

      const usableNetwork = await ensureUsableNetworkForUser({
        supabase,
        user,
        networkId: data.network_id,
        networkType,
      });

      if (usableNetwork.usedFallback) {
        return {
          networkId: usableNetwork.networkId,
          vaultId: usableNetwork.vaultId,
          vault: null,
          usedFallback: true,
        };
      }

      return {
        networkId: usableNetwork.networkId,
        vaultId: data.id,
        vault: data,
      };
    }
  }

  throw new Error("Choose a vault before saving this memory.");
}

export async function createMobileVault({
  supabase,
  user,
  subjectName,
  relationshipLabel,
  description,
  networkType = "family",
}) {
  if (!user?.id) {
    throw new Error("Please sign in first.");
  }

  const desiredType = networkType === "friend" ? "friend" : "family";
  const labels = networkLabels(desiredType);
  const networkId = crypto.randomUUID();
  const vaultId = crypto.randomUUID();

  const cleanName = subjectName?.trim() || "Loved One";
  const cleanRelationship = relationshipLabel?.trim() || (networkType === "friend" ? "Friend" : "Family");

  const networkResult = await supabase.from("networks").insert({
    id: networkId,
    created_by: user.id,
    name: `${cleanName} Private Network`,
    type: desiredType,
    description: labels.networkDescription,
  });

  if (networkResult.error) {
    throw new Error(networkResult.error.message);
  }

  const memberResult = await supabase.from("network_members").insert({
    network_id: networkId,
    user_id: user.id,
    role: "owner",
    invited_by: user.id,
    accepted_at: new Date().toISOString(),
  });

  if (memberResult.error) {
    throw new Error(memberResult.error.message);
  }

  const result = await supabase.from("vaults").insert({
    id: vaultId,
    network_id: networkId,
    created_by: user.id,
    title: cleanName,
    subject_name: cleanName,
    relationship_label: cleanRelationship,
    description: description?.trim() || "Private family vault.",
    visibility: "private",
    is_loved_one_vault: true,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  await supabase.from("network_activity").insert({
    network_id: networkId,
    vault_id: vaultId,
    actor_id: user.id,
    activity_type: "profile_added",
    title: `New profile: ${cleanName}`,
    metadata: {
      source: "mobile",
      relationship_label: cleanRelationship,
      network_type: networkType,
    },
  });

  return {
    networkId,
    vaultId,
  };
}

export async function saveMobileMemoryToV2({
  supabase,
  user,
  file,
  title,
  note,
  folder = "mobile-uploads",
  forcedType,
  networkType = "family",
  targetVaultId,
  onProgress,
}) {
  if (!user?.id) {
    throw new Error("Please sign in first.");
  }

  if (!file) {
    throw new Error("Choose or record a file first.");
  }

  onProgress?.({
    percent: 5,
    uploadedBytes: 0,
    totalBytes: file.size || 0,
    status: "preparing",
  });

  const { networkId, vaultId } = await resolveTargetVault({
    supabase,
    user,
    targetVaultId,
    networkType,
  });

  const fileName = getSafeFileName(file.name || `memory-${Date.now()}.webm`);
  const filePath = `${user.id}/${folder}/${Date.now()}-${fileName}`;
  const mimeType = file.type || "application/octet-stream";
  const memoryType = forcedType || inferMemoryType(mimeType);
  const memoryId = crypto.randomUUID();

  onProgress?.({
    percent: 10,
    uploadedBytes: 0,
    totalBytes: file.size || 0,
    status: "uploading",
  });

  const uploadResult = await supabase.storage
    .from("family-media")
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message);
  }

  onProgress?.({
    percent: 88,
    uploadedBytes: file.size || 0,
    totalBytes: file.size || 0,
    status: "saving",
  });

  const cleanTitle =
    title?.trim() ||
    note?.trim()?.slice(0, 80) ||
    file.name ||
    "Mobile memory";

  const memoryResult = await supabase.from("memories").insert({
    id: memoryId,
    network_id: networkId,
    vault_id: vaultId,
    created_by: user.id,
    type: memoryType,
    title: cleanTitle,
    body: note?.trim() || null,
    media_path: filePath,
    media_mime_type: mimeType,
    media_size_bytes: file.size || 0,
    feed_visibility: "network",
    show_on_public_page: false,
    is_family_visible: true,
    is_public_approved: false,
    requires_admin_approval: false,
  });

  if (memoryResult.error) {
    await cleanupUploadedFile(supabase, "family-media", filePath, "mobile memory upload");
    throw new Error(memoryResult.error.message);
  }

  onProgress?.({
    percent: 93,
    uploadedBytes: file.size || 0,
    totalBytes: file.size || 0,
    status: "saving",
  });

  await supabase.from("network_activity").insert({
    network_id: networkId,
    vault_id: vaultId,
    memory_id: memoryId,
    actor_id: user.id,
    activity_type:
      memoryType === "photo"
        ? "photo_added"
        : memoryType === "video"
          ? "video_added"
          : memoryType === "audio"
            ? "voice_added"
            : "memory_added",
    title: cleanTitle,
    feed_visibility: "network",
    is_commentable: true,
    metadata: {
      source: "mobile",
      media_path: filePath,
      media_mime_type: mimeType,
      network_type: networkType,
    },
  });

  onProgress?.({
    percent: 95,
    uploadedBytes: file.size || 0,
    totalBytes: file.size || 0,
    status: "saving",
  });

  return {
    memoryId,
    networkId,
    vaultId,
    filePath,
  };
}
