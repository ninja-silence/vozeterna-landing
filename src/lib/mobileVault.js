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

export async function ensureDefaultNetworkAndVault(supabase, user) {
  if (!user?.id) {
    throw new Error("Please sign in first.");
  }

  const existingMembership = await supabase
    .from("network_members")
    .select("network_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .maybeSingle();

  if (existingMembership.data?.network_id) {
    const networkId = existingMembership.data.network_id;

    const existingVault = await supabase
      .from("vaults")
      .select("id")
      .eq("network_id", networkId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingVault.data?.id) {
      return {
        networkId,
        vaultId: existingVault.data.id,
      };
    }

    const vaultId = crypto.randomUUID();

    const vaultResult = await supabase.from("vaults").insert({
      id: vaultId,
      network_id: networkId,
      created_by: user.id,
      title: "My Family Vault",
      subject_name: "Family Memories",
      relationship_label: "Family",
      description: "Private mobile family vault.",
      visibility: "private",
      is_loved_one_vault: true,
    });

    if (vaultResult.error) {
      throw new Error(vaultResult.error.message);
    }

    return {
      networkId,
      vaultId,
    };
  }

  const networkId = crypto.randomUUID();
  const vaultId = crypto.randomUUID();

  const networkResult = await supabase.from("networks").insert({
    id: networkId,
    created_by: user.id,
    name: "My Family Network",
    type: "family",
    description: "Private family network created from the mobile app.",
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

  const vaultResult = await supabase.from("vaults").insert({
    id: vaultId,
    network_id: networkId,
    created_by: user.id,
    title: "My Family Vault",
    subject_name: "Family Memories",
    relationship_label: "Family",
    description: "Private mobile family vault.",
    visibility: "private",
    is_loved_one_vault: true,
  });

  if (vaultResult.error) {
    throw new Error(vaultResult.error.message);
  }

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
}) {
  if (!user?.id) {
    throw new Error("Please sign in first.");
  }

  if (!file) {
    throw new Error("Choose or record a file first.");
  }

  const { networkId, vaultId } = await ensureDefaultNetworkAndVault(supabase, user);

  const fileName = getSafeFileName(file.name || `memory-${Date.now()}.webm`);
  const filePath = `${user.id}/${folder}/${Date.now()}-${fileName}`;
  const mimeType = file.type || "application/octet-stream";
  const memoryType = forcedType || inferMemoryType(mimeType);
  const memoryId = crypto.randomUUID();

  const uploadResult = await supabase.storage
    .from("family-media")
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message);
  }

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
    is_family_visible: true,
    is_public_approved: false,
    requires_admin_approval: false,
  });

  if (memoryResult.error) {
    throw new Error(memoryResult.error.message);
  }

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
    metadata: {
      source: "mobile",
      media_path: filePath,
      media_mime_type: mimeType,
    },
  });

  return {
    memoryId,
    networkId,
    vaultId,
    filePath,
  };
}