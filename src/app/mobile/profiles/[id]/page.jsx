"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Camera,
  Copy,
  ExternalLink,
  FileText,
  FolderPlus,
  Image as ImageIcon,
  LockKeyhole,
  Mic2,
  QrCode,
  Share2,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { isMemoryOwner } from "../../../../lib/memoryPermissions";
import { getVaultAccess } from "../../../../lib/mobileVault";
import { cleanupUploadedFile } from "../../../../lib/storageCleanup";
import { normalizeStoragePath, warnInvalidStoragePath } from "../../../../lib/storagePaths";
import {
  getVaultSkin,
  getVaultSkinImage,
  getVaultSkinVideo,
  normalizeVaultSkin,
  VAULT_SKIN_KEYS,
} from "../../../../lib/vaultSkins";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";
import ShareMemoryButton from "../../../../components/social/ShareMemoryButton";
import MobileMemoryActions from "../../../../components/mobile/MobileMemoryActions";

const copy = {
  en: {
    label: "Vault",
    loading: "Loading profile...",
    notFound: "Vault not found.",
    notFoundText: "We could not find this vault, or you may not have access to it.",
    backProfiles: "Back to vaults",
    memories: "Memories",
    albums: "Albums",
    newAlbum: "New album",
    albumPlaceholder: "Album title...",
    createAlbum: "Create album",
    albumCreated: "Album created.",
    deleteAlbum: "Delete album",
    deleteAlbumConfirm: "Delete this album? Memories will stay in your library.",
    albumDeleted: "Album deleted.",
    addToAlbum: "Add to album",
    chooseAlbum: "Choose album",
    addedToAlbum: "Added to album.",
    empty: "No memories connected yet.",
    noAlbums: "No albums yet.",
    upload: "Add memory",
    uploadToAlbum: "Upload to album",
    invite: "QR invite",
    updatePhoto: "Update photo",
    savingPhoto: "Saving photo...",
    photoSaved: "Vault photo updated.",
    photoOwnerOnly: "Only the vault owner can update this photo.",
    openVault: "Open vault",
    unlockVault: "Unlock Vault",
    enterVault: "Enter Vault",
    openingVault: "Opening...",
    vaultOpened: "Vault opened",
    incorrectUnlock: "Incorrect unlock attempt. Please try again.",
    lockedOut: "Too many unlock attempts. Please verify your identity to continue.",
    verifyEmail: "Verify by email",
    tryLater: "Try again later",
    demoWrongCode: "Demo wrong code",
    vaultStyle: "Vault style",
    styleSaved: "Vault style updated.",
    styleSaveFailed: "Could not update vault style.",
    publicPage: "Public page",
    enablePublic: "Enable public page",
    disablePublic: "Disable public page",
    publicEnabled: "Public page enabled.",
    publicDisabled: "Public page disabled.",
    copyPublic: "Copy public link",
    copied: "Copied.",
    viewPublic: "View public page",
    publicNote: "Only memories you approve for public page will show.",
    approvePublic: "Show on public page",
    hidePublic: "Hide from public page",
    publicUpdated: "Public visibility updated.",
    delete: "Delete",
    privateArchive: "Private family archive.",
    familyVault: "Family vault",
    share: {
      share: "Share",
      shared: "Shared",
      copied: "Copied",
      copyManually: "Copy manually",
      textPrefix: "A private VozEterna memory:",
    },
    actions: {
      view: "View",
      edit: "Edit",
      delete: "Delete",
      share: "Share",
      copied: "Copied",
      comments: "Comments",
      confirmDelete: "Delete this memory? This cannot be undone.",
      deleteFailed: "Could not delete memory.",
    },
  },
  es: {
    label: "Boveda",
    loading: "Cargando boveda...",
    notFound: "Boveda no encontrada.",
    notFoundText: "No pudimos encontrar esta boveda, o quiza no tienes acceso.",
    backProfiles: "Volver a bovedas",
    memories: "Recuerdos",
    albums: "Álbumes",
    newAlbum: "Nuevo álbum",
    albumPlaceholder: "Título del álbum...",
    createAlbum: "Crear álbum",
    albumCreated: "Álbum creado.",
    deleteAlbum: "Eliminar álbum",
    deleteAlbumConfirm: "¿Eliminar este álbum? Los recuerdos permanecerán en tu biblioteca.",
    albumDeleted: "Álbum eliminado.",
    addToAlbum: "Agregar a álbum",
    chooseAlbum: "Elegir álbum",
    addedToAlbum: "Agregado al álbum.",
    empty: "Todavía no hay recuerdos conectados.",
    noAlbums: "Todavía no hay álbumes.",
    upload: "Agregar recuerdo",
    uploadToAlbum: "Subir al álbum",
    invite: "Invitar QR",
    updatePhoto: "Actualizar foto",
    savingPhoto: "Guardando foto...",
    photoSaved: "Foto de la boveda actualizada.",
    photoOwnerOnly: "Solo el dueno de la boveda puede actualizar esta foto.",
    openVault: "Abrir boveda",
    unlockVault: "Desbloquear boveda",
    enterVault: "Entrar a la boveda",
    openingVault: "Abriendo...",
    vaultOpened: "Boveda abierta",
    incorrectUnlock: "Intento de desbloqueo incorrecto. Intentalo de nuevo.",
    lockedOut: "Demasiados intentos de desbloqueo. Verifica tu identidad para continuar.",
    verifyEmail: "Verificar por correo",
    tryLater: "Intentar mas tarde",
    demoWrongCode: "Demo codigo incorrecto",
    vaultStyle: "Estilo de boveda",
    styleSaved: "Estilo de boveda actualizado.",
    styleSaveFailed: "No se pudo actualizar el estilo de boveda.",
    publicPage: "Página pública",
    enablePublic: "Activar página pública",
    disablePublic: "Desactivar página pública",
    publicEnabled: "Página pública activada.",
    publicDisabled: "Página pública desactivada.",
    copyPublic: "Copiar enlace público",
    copied: "Copiado.",
    viewPublic: "Ver página pública",
    publicNote: "Solo se mostrarán recuerdos que apruebes para la página pública.",
    approvePublic: "Mostrar en página pública",
    hidePublic: "Ocultar de página pública",
    publicUpdated: "Visibilidad pública actualizada.",
    delete: "Eliminar",
    privateArchive: "Archivo familiar privado.",
    familyVault: "Boveda familiar",
    share: {
      share: "Compartir",
      shared: "Compartido",
      copied: "Copiado",
      copyManually: "Copiar manualmente",
      textPrefix: "Un recuerdo privado de VozEterna:",
    },
    actions: {
      view: "Ver",
      edit: "Editar",
      delete: "Eliminar",
      share: "Compartir",
      copied: "Copiado",
      comments: "Comentarios",
      confirmDelete: "¿Eliminar este recuerdo? Esto no se puede deshacer.",
      deleteFailed: "No se pudo eliminar el recuerdo.",
    },
  },
};

function getMemoryIcon(type) {
  if (type === "photo") return ImageIcon;
  if (type === "audio") return Mic2;
  if (type === "video") return Video;
  return FileText;
}

export default function MobileProfileDetailPage() {
  const params = useParams();
  const vaultId = params?.id;
  const photoInputRef = useRef(null);

  const [language, setLanguage] = useState("en");
  const [vault, setVault] = useState(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [memories, setMemories] = useState([]);
  const [activitiesByMemory, setActivitiesByMemory] = useState({});
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumByMemory, setSelectedAlbumByMemory] = useState({});
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [canUpdatePhoto, setCanUpdatePhoto] = useState(false);
  const [canManageVault, setCanManageVault] = useState(false);
  const [canUploadToVault, setCanUploadToVault] = useState(false);
  const [vaultVisualState, setVaultVisualState] = useState("idle");
  const [vaultMediaState, setVaultMediaState] = useState("idle");
  const [unlockMessage, setUnlockMessage] = useState("");
  const [failedUnlockAttempts, setFailedUnlockAttempts] = useState(0);
  const [skinSaving, setSkinSaving] = useState(false);
  const [skinMessage, setSkinMessage] = useState("");

  const t = copy[language] || copy.en;
  const canCurrentUserUpdatePhoto = canUpdatePhoto || isVaultCreatedByUser(vault, currentUserId);

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());

    function handleLanguageChange(event) {
      if (event.detail === "en" || event.detail === "es") setLanguage(event.detail);
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);
    return () => window.removeEventListener("vozeterna-language-change", handleLanguageChange);
  }, []);

  useEffect(() => {
    if (vaultId) loadProfile(vaultId);
  }, [vaultId]);

  function isVaultCreatedByUser(vaultData, userOrId) {
    const userId = typeof userOrId === "string" ? userOrId : userOrId?.id;
    return Boolean(vaultData?.created_by && userId && vaultData.created_by === userId);
  }

  function isVaultCoverManagerRole(role) {
    return ["owner", "admin", "manager"].includes(String(role || "").toLowerCase());
  }

  async function canManageVaultPhoto(vaultData, user) {
    if (!vaultData?.id || !user?.id) return false;

    if (isVaultCreatedByUser(vaultData, user)) return true;

    const { data: vaultMember } = await supabase
      .from("vault_memberships")
      .select("role")
      .eq("vault_id", vaultData.id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (isVaultCoverManagerRole(vaultMember?.role)) return true;

    if (vaultData.network_id) {
      const { data: member } = await supabase
        .from("network_members")
        .select("role")
        .eq("network_id", vaultData.network_id)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (isVaultCoverManagerRole(member?.role)) return true;
    }

    return false;
  }

  async function canViewVault(vaultData, user) {
    if (!vaultData?.id || !user?.id) return false;

    if (vaultData.created_by === user.id) return true;

    const { data: vaultMember } = await supabase
      .from("vault_memberships")
      .select("vault_id")
      .eq("vault_id", vaultData.id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (vaultMember?.vault_id) return true;

    if (!vaultData.network_id) return false;

    const { data: networkMember } = await supabase
      .from("network_members")
      .select("network_id")
      .eq("network_id", vaultData.network_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    return Boolean(networkMember?.network_id);
  }

  async function loadProfile(id) {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || "");

    const { data: vaultData, error: vaultError } = await supabase
      .from("vaults")
      .select("id, network_id, created_by, title, subject_name, relationship_label, description, cover_image_path, vault_skin, public_enabled, public_slug, public_title, public_description, created_at")
      .eq("id", id)
      .maybeSingle();

    if (vaultError || !vaultData) {
      setVault(null);
      setMemories([]);
      setCanUpdatePhoto(false);
      setCanManageVault(false);
      setCanUploadToVault(false);
      setLoading(false);
      return;
    }

    const access = await getVaultAccess(supabase, user, vaultData);

    if (!access.canView) {
      setVault(null);
      setMemories([]);
      setCanUpdatePhoto(false);
      setCanManageVault(false);
      setCanUploadToVault(false);
      setLoading(false);
      return;
    }

    let nextCoverUrl = "";

    const coverPath = normalizeStoragePath(vaultData.cover_image_path);
    if (coverPath) {
      const { data: signedCover, error: signedCoverError } = await supabase.storage
        .from("family-media")
        .createSignedUrl(coverPath, 3600);

      if (!signedCoverError && signedCover?.signedUrl) {
        nextCoverUrl = signedCover.signedUrl;
      } else {
        console.warn("[VozEterna] Could not sign mobile vault cover image:", signedCoverError?.message || vaultData.cover_image_path);
        warnInvalidStoragePath("mobile profile cover", vaultData.cover_image_path);
      }
    } else if (vaultData.cover_image_path) {
      warnInvalidStoragePath("mobile profile cover", vaultData.cover_image_path);
    }

    const { data: memoryData } = await supabase
      .from("memories")
      .select("id, title, body, type, media_path, media_mime_type, feed_visibility, show_on_public_page, created_by, vault_id, network_id, created_at")
      .eq("vault_id", id)
      .order("created_at", { ascending: false });

    const { data: albumData } = await supabase
      .from("vault_albums")
      .select("id, title, description, created_at")
      .eq("vault_id", id)
      .order("created_at", { ascending: false });

    const rows = memoryData || [];
    const urls = {};

    await Promise.all(
      rows.map(async (memory) => {
        const mediaPath = normalizeStoragePath(memory.media_path);
        if (!mediaPath) {
          if (memory.media_path) warnInvalidStoragePath("mobile profile memory", memory.media_path);
          return;
        }

        const { data: signed, error: signedError } = await supabase.storage
          .from("family-media")
          .createSignedUrl(mediaPath, 3600);

        if (!signedError && signed?.signedUrl) {
          urls[memory.id] = signed.signedUrl;
        } else {
          warnInvalidStoragePath("mobile profile memory", memory.media_path);
        }
      })
    );

    let activityMap = {};

    if (rows.length > 0) {
      const { data: activityRows } = await supabase
        .from("network_activity")
        .select("id, memory_id, actor_id, feed_visibility, is_commentable")
        .in("memory_id", rows.map((memory) => memory.id));

      activityMap = (activityRows || []).reduce((map, item) => {
        map[item.memory_id] = item;
        return map;
      }, {});
    }

    setVault(vaultData);
    setCanUpdatePhoto(access.canManage || isVaultCreatedByUser(vaultData, user));
    setCanManageVault(access.canManage);
    setCanUploadToVault(access.canUpload);
    setCoverUrl(nextCoverUrl);
    setMemories(rows);
    setActivitiesByMemory(activityMap);
    setAlbums(albumData || []);
    setSignedUrls(urls);
    setLoading(false);
  }

  async function updateProfilePhoto(event) {
    const file = event.target.files?.[0];
    if (!file || !vault) return;

    setPhotoSaving(true);
    setPhotoMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Please sign in first.");

      const access = await getVaultAccess(supabase, user, vault);
      const allowedToUpdatePhoto = isVaultCreatedByUser(vault, user) || access.canManage;
      if (!allowedToUpdatePhoto) throw new Error(t.photoOwnerOnly);
      if (!canUpdatePhoto) setCanUpdatePhoto(true);

      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const filePath = `${user.id}/profile-covers/${vault.id}-${Date.now()}-${safeName}`;

      const uploadResult = await supabase.storage
        .from("family-media")
        .upload(filePath, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (uploadResult.error) throw new Error(uploadResult.error.message);

      const normalizedCoverPath = normalizeStoragePath(filePath);
      const { data: signedCover, error: signedCoverError } = await supabase.storage
        .from("family-media")
        .createSignedUrl(normalizedCoverPath, 3600);

      const updateResult = await supabase
        .from("vaults")
        .update({
          cover_image_path: filePath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vault.id);

      if (updateResult.error) {
        await cleanupUploadedFile(
          supabase,
          "family-media",
          normalizedCoverPath || filePath,
          "failed vault cover upload"
        );
        throw new Error(updateResult.error.message);
      }

      setVault((current) => ({ ...(current || vault), cover_image_path: filePath }));
      if (!signedCoverError && signedCover?.signedUrl) {
        setCoverUrl(signedCover.signedUrl);
      } else {
        console.warn("[VozEterna] Vault photo saved but signed URL failed:", signedCoverError?.message || filePath);
      }
      setPhotoMessage(t.photoSaved);
      loadProfile(vault.id);
    } catch (error) {
      setPhotoMessage(error.message || "Could not update profile photo.");
    } finally {
      setPhotoSaving(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  }

  function previewOpenVault() {
    const openVideo = getVaultSkinVideo(vault?.vault_skin, "opening");

    setVaultVisualState("opening");
    setVaultMediaState("opening");
    setUnlockMessage("");

    if (openVideo) {
      return;
    }

    revealVaultContents();
  }

  function previewWrongCode() {
    const nextFailedAttempts = failedUnlockAttempts + 1;
    const nextState = nextFailedAttempts >= 3 ? "lockedOut" : "wrongCode";
    const wrongVideo = getVaultSkinVideo(vault?.vault_skin, nextState);

    setFailedUnlockAttempts(nextFailedAttempts);
    setVaultVisualState(nextState === "lockedOut" ? "locked" : "warning");
    setVaultMediaState(nextState);
    setUnlockMessage(nextState === "lockedOut" ? t.lockedOut : t.incorrectUnlock);

    if (wrongVideo) {
      return;
    }

    setVaultMediaState("idle");
  }

  function revealVaultContents() {
    setVaultMediaState("idle");
    setUnlockMessage("");
    setFailedUnlockAttempts(0);
    setVaultVisualState("success");
    document.getElementById("vault-contents")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.setTimeout(() => setVaultVisualState("idle"), 900);
  }

  function resetVaultStage() {
    setVaultMediaState("idle");
    if (vaultVisualState !== "locked") {
      setVaultVisualState("idle");
    }
  }

  function handleVaultAnimationEnded() {
    if (vaultMediaState === "opening") {
      revealVaultContents();
      return;
    }

    resetVaultStage();
  }

  function handleVaultAnimationError() {
    if (vaultMediaState === "opening") {
      revealVaultContents();
      return;
    }

    resetVaultStage();
  }

  function clearSoftLockout() {
    setFailedUnlockAttempts(0);
    setUnlockMessage("");
    setVaultVisualState("idle");
    setVaultMediaState("idle");
  }

  async function updateVaultSkin(nextSkin) {
    const safeSkin = normalizeVaultSkin(nextSkin);
    if (!vault?.id || safeSkin === normalizeVaultSkin(vault.vault_skin)) return;

    setSkinSaving(true);
    setSkinMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Please sign in first.");

      const access = await getVaultAccess(supabase, user, vault);
      if (!access.canManage) throw new Error(t.styleSaveFailed);

      const { error } = await supabase
        .from("vaults")
        .update({
          vault_skin: safeSkin,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vault.id);

      if (error) throw new Error(error.message);

      setVault((current) => ({ ...(current || vault), vault_skin: safeSkin }));
      setSkinMessage(t.styleSaved);
    } catch (error) {
      setSkinMessage(error.message || t.styleSaveFailed);
    } finally {
      setSkinSaving(false);
    }
  }

  async function createAlbum() {
    const cleanTitle = newAlbumTitle.trim();
    if (!cleanTitle || !vault) return;

    setActionMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Please sign in first.");
      const access = await getVaultAccess(supabase, user, vault);
      if (!access.canManage) throw new Error("Only the vault owner or an admin can manage albums.");

      const { error } = await supabase.from("vault_albums").insert({
        network_id: vault.network_id,
        vault_id: vault.id,
        created_by: user.id,
        title: cleanTitle,
      });

      if (error) throw new Error(error.message);

      setNewAlbumTitle("");
      setActionMessage(t.albumCreated);
      loadProfile(vault.id);
    } catch (error) {
      setActionMessage(error.message || "Could not create album.");
    }
  }

  async function deleteAlbum(albumId) {
    const confirmed = window.confirm(t.deleteAlbumConfirm);
    if (!confirmed) return;

    setActionMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const access = await getVaultAccess(supabase, user, vault);
    if (!access.canManage) {
      setActionMessage("Only the vault owner or an admin can manage albums.");
      return;
    }

    const { error } = await supabase
      .from("vault_albums")
      .delete()
      .eq("id", albumId);

    if (error) {
      setActionMessage(error.message);
      return;
    }

    setActionMessage(t.albumDeleted);
    loadProfile(vault.id);
  }

  async function addMemoryToAlbum(memoryId) {
    const albumId = selectedAlbumByMemory[memoryId];
    if (!albumId) return;

    setActionMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Please sign in first.");

      const { error } = await supabase.from("vault_album_items").insert({
        album_id: albumId,
        memory_id: memoryId,
        created_by: user.id,
      });

      if (error) throw new Error(error.message);

      setActionMessage(t.addedToAlbum);
    } catch (error) {
      setActionMessage(error.message || "Could not add to album.");
    }
  }

  async function togglePublicPage() {
    if (!vault) return;

    setActionMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const access = await getVaultAccess(supabase, user, vault);
    if (!access.canManage) {
      setActionMessage("Only the vault owner or an admin can manage the public page.");
      return;
    }

    if (vault.public_enabled) {
      const { error } = await supabase
        .from("vaults")
        .update({
          public_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vault.id);

      if (error) {
        setActionMessage(error.message);
        return;
      }

      setActionMessage(t.publicDisabled);
      loadProfile(vault.id);
      return;
    }

    const baseName = vault.subject_name || vault.title || "vozeterna";

    const { data: slugData, error: slugError } = await supabase.rpc("generate_public_slug", {
      input_text: baseName,
    });

    if (slugError) {
      setActionMessage(slugError.message);
      return;
    }

    const { error } = await supabase
      .from("vaults")
      .update({
        public_enabled: true,
        public_slug: slugData,
        public_title: vault.subject_name || vault.title,
        public_description: vault.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vault.id);

    if (error) {
      setActionMessage(error.message);
      return;
    }

    setActionMessage(t.publicEnabled);
    loadProfile(vault.id);
  }

  async function copyPublicLink() {
    if (!vault?.public_slug) return;

    const url = `${window.location.origin}/p/${vault.public_slug}`;
    await navigator.clipboard.writeText(url);
    setActionMessage(t.copied);
  }

  async function toggleMemoryPublic(memory) {
    if (!isMemoryOwner(memory, null, currentUserId)) {
      setActionMessage("You do not have permission to change this memory.");
      return;
    }

    const nextValue = !memory.show_on_public_page;

    const { error } = await supabase
      .from("memories")
      .update({
        show_on_public_page: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memory.id);

    if (error) {
      setActionMessage(error.message);
      return;
    }

    setActionMessage(t.publicUpdated);
    loadProfile(vault.id);
  }

  function removeDeleted(id) {
    setMemories((current) => current.filter((memory) => memory.id !== id));
  }

  if (loading) {
    return (
      <section className="mobileScreenStack">
        <div className="mobileScreenHero">
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.loading}</h1>
        </div>
      </section>
    );
  }

  if (!vault) {
    return (
      <section className="mobileScreenStack">
        <div className="mobileScreenHero">
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.notFound}</h1>
          <p>{t.notFoundText}</p>
          <Link href="/mobile/profiles" className="mobilePrimaryButton">{t.backProfiles}</Link>
        </div>
      </section>
    );
  }

  const skinKey = normalizeVaultSkin(vault.vault_skin);
  const skin = getVaultSkin(skinKey);
  const vaultImageSrc = getVaultSkinImage(skinKey);
  const vaultVideoSrc = vaultMediaState === "idle" ? "" : getVaultSkinVideo(skinKey, vaultMediaState);
  const isVaultVideoPlaying = vaultMediaState !== "idle" && Boolean(vaultVideoSrc);
  const isSoftLockedOut = failedUnlockAttempts >= 3 || vaultVisualState === "locked";

  return (
    <section className="mobileScreenStack">
      <div className={`mobileScreenHero mobileProfileHero mobileVaultDetailHero state-${vaultVisualState}`}>
        <div className="mobileVaultSkinStage vaultSkinFrame">
          {isVaultVideoPlaying && vaultVideoSrc ? (
            <video
              key={`${skinKey}-${vaultMediaState}`}
              src={vaultVideoSrc}
              className="mobileVaultSkinStageImage vaultSkinMedia vaultSkinVideo"
              autoPlay
              muted
              playsInline
              preload="metadata"
              onEnded={handleVaultAnimationEnded}
              onError={handleVaultAnimationError}
            />
          ) : (
            <img
              src={vaultImageSrc}
              alt=""
              className="mobileVaultSkinStageImage vaultSkinMedia"
              onError={(event) => {
                const fallbackSrc = getVaultSkinImage("steel");
                if (!event.currentTarget.src.endsWith(fallbackSrc)) {
                  event.currentTarget.src = fallbackSrc;
                }
              }}
            />
          )}
          <span className="mobileVaultSkinStageShade" />
          <div className="mobileVaultEngravedLabel">
            <span>{skin.label[language]}</span>
            <strong>{vault.subject_name || vault.title}</strong>
          </div>
          {!isVaultVideoPlaying && !isSoftLockedOut && (
            <button type="button" className="mobileVaultOpenButton" onClick={previewOpenVault}>
              <LockKeyhole size={16} />
              {vaultVisualState === "opening"
                ? t.openingVault
                : vaultVisualState === "success"
                  ? t.vaultOpened
                  : t.unlockVault}
            </button>
          )}
          {unlockMessage && (
            <div className="vaultUnlockOverlay">
              <p className="vaultUnlockMessage">{unlockMessage}</p>
              {isSoftLockedOut && (
                <div className="vaultUnlockActions">
                  <button type="button" onClick={clearSoftLockout}>
                    {t.verifyEmail}
                  </button>
                  <button type="button" onClick={clearSoftLockout}>
                    {t.tryLater}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {!isVaultVideoPlaying && !isSoftLockedOut && (
          <button type="button" className="mobileMiniAction" onClick={previewWrongCode}>
            {t.demoWrongCode}
          </button>
        )}

        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{vault.subject_name || vault.title}</h1>
        <p>{vault.description || t.privateArchive}</p>

        {coverUrl ? (
          <img src={coverUrl} alt={vault.subject_name || vault.title} className="mobileProfileCover" />
        ) : (
          <div className="mobileProfileCoverPlaceholder"><Camera size={30} /></div>
        )}

        {canCurrentUserUpdatePhoto ? (
          <button type="button" className="mobilePhotoButton" onClick={() => photoInputRef.current?.click()} disabled={photoSaving}>
            <Camera size={16} />
            {photoSaving ? t.savingPhoto : t.updatePhoto}
          </button>
        ) : (
          <p className="mobileFormHelper">{t.photoOwnerOnly}</p>
        )}

        <input ref={photoInputRef} type="file" hidden accept="image/*" onChange={updateProfilePhoto} />
        {photoMessage && <p className="mobileFormMessage">{photoMessage}</p>}
      </div>

      {canManageVault && (
        <section className="mobileFormCard mobileVaultSkinSelector">
          <p className="mobileCapsLabel">{t.vaultStyle}</p>
          <div className="mobileVaultSkinOptions">
            {VAULT_SKIN_KEYS.map((key) => {
              const option = getVaultSkin(key);
              const selected = key === skinKey;

              return (
                <button
                  type="button"
                  key={key}
                  className={selected ? "active" : ""}
                  onClick={() => updateVaultSkin(key)}
                  disabled={skinSaving}
                >
                  <img src={getVaultSkinImage(key)} alt="" />
                  <span>{option.label[language]}</span>
                </button>
              );
            })}
          </div>
          {skinMessage && <p className="mobileFormMessage">{skinMessage}</p>}
        </section>
      )}

      {(canUploadToVault || canManageVault) && (
        <section className="mobileActionGrid">
          {canUploadToVault && (
            <Link href={`/mobile/upload?vaultId=${vault.id}`} className="mobileActionCard primary">
              <UploadCloud size={20} />
              <strong>{t.upload}</strong>
            </Link>
          )}

          {canManageVault && (
            <Link href={`/mobile/connect?networkId=${vault.network_id}&vaultId=${vault.id}`} className="mobileActionCard">
              <QrCode size={20} />
              <strong>{t.invite}</strong>
            </Link>
          )}
        </section>
      )}

      {canManageVault && (
        <section className="mobileFormCard">
          <p className="mobileCapsLabel">{t.publicPage}</p>
          <p className="mobileFormHelper">{t.publicNote}</p>

          <button type="button" onClick={togglePublicPage}>
            {vault.public_enabled ? t.disablePublic : t.enablePublic}
          </button>

          {vault.public_enabled && vault.public_slug && (
            <div className="mobilePublicActions">
              <button type="button" onClick={copyPublicLink}>
                <Copy size={16} />
                {t.copyPublic}
              </button>

              <Link href={`/p/${vault.public_slug}`} target="_blank">
                <ExternalLink size={16} />
                {t.viewPublic}
              </Link>
            </div>
          )}
        </section>
      )}

      {canManageVault && (
        <section className="mobileFormCard">
          <p className="mobileCapsLabel">{t.albums}</p>

        <div className="mobileAlbumCreateRow">
          <input value={newAlbumTitle} onChange={(event) => setNewAlbumTitle(event.target.value)} placeholder={t.albumPlaceholder} />
          <button type="button" onClick={createAlbum}>
            <FolderPlus size={16} />
            {t.createAlbum}
          </button>
        </div>

        {albums.length === 0 ? (
          <p className="mobileFormHelper">{t.noAlbums}</p>
        ) : (
          <div className="mobileAlbumList">
            {albums.map((album) => (
              <article key={album.id}>
                <Link href={`/mobile/albums/${album.id}`}>{album.title}</Link>
                <button type="button" onClick={() => deleteAlbum(album.id)}>
                  <Trash2 size={15} />
                  {t.deleteAlbum}
                </button>
              </article>
            ))}
          </div>
        )}

          {actionMessage && <p className="mobileFormMessage">{actionMessage}</p>}
        </section>
      )}

      <section className="mobileCardList" id="vault-contents">
        <p className="mobileCapsLabel">{t.memories}</p>

        {memories.length === 0 ? (
          <div className="mobileEmptyCard">
            <p>{t.empty}</p>
            {canUploadToVault && (
              <Link href={`/mobile/upload?vaultId=${vault.id}`} className="mobileRecorderPrimary">{t.upload}</Link>
            )}
          </div>
        ) : (
          memories.map((memory) => {
            const Icon = getMemoryIcon(memory.type);
            const url = signedUrls[memory.id];
            const activity = activitiesByMemory[memory.id];
            const canManageMemory = isMemoryOwner(memory, activity, currentUserId);

            return (
              <article className="mobileMemoryCard" key={memory.id}>
                <div className="mobileMemoryCardTopActions">
                  <span>{memory.feed_visibility === "network" ? "Network feed" : "Private"}</span>
                  <MobileMemoryActions
                    memory={memory}
                    activityId={activity?.id}
                    activity={activity}
                    currentUserId={currentUserId}
                    labels={t.actions}
                    onDeleted={removeDeleted}
                  />
                </div>

                {memory.type === "photo" && url && <img src={url} alt={memory.title || "Memory"} />}
                {memory.type === "audio" && url && <audio src={url} controls />}
                {memory.type === "video" && url && <video src={url} controls playsInline />}
                {!url && <div className="mobileMemoryIconOnly"><Icon size={24} /></div>}

                <div>
                  <strong>{memory.title || "Memory"}</strong>
                  {memory.body && <p>{memory.body}</p>}

                  {vault.public_enabled && canManageMemory && (
                    <button type="button" className="mobileMiniAction" onClick={() => toggleMemoryPublic(memory)}>
                      {memory.show_on_public_page ? t.hidePublic : t.approvePublic}
                    </button>
                  )}

                  {albums.length > 0 && (
                    <div className="mobileAlbumAssign">
                      <select
                        value={selectedAlbumByMemory[memory.id] || ""}
                        onChange={(event) =>
                          setSelectedAlbumByMemory((current) => ({
                            ...current,
                            [memory.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">{t.chooseAlbum}</option>
                        {albums.map((album) => (
                          <option value={album.id} key={album.id}>{album.title}</option>
                        ))}
                      </select>

                      <button type="button" onClick={() => addMemoryToAlbum(memory.id)}>
                        {t.addToAlbum}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}
