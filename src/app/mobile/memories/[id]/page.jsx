"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  FileText,
  FolderPlus,
  ImageOff,
  MessageCircle,
  ShieldCheck,
  Trash2,
  Volume2,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { isMemoryOwner } from "../../../../lib/memoryPermissions";
import { normalizeStoragePath, warnInvalidStoragePath } from "../../../../lib/storagePaths";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Memory",
    loading: "Loading memory...",
    notFound: "Memory not found",
    backLibrary: "Back to library",
    untitled: "Untitled memory",
    networkFeed: "Network feed",
    private: "Private",
    publicPage: "Public page",
    mediaUnavailable: "Media unavailable",
    mediaUnavailableText: "This file may be missing, private, or still processing.",
    noDescription: "No description yet.",
    aiNarration: "AI voice narration",
    noNarration: "No narration generated yet.",
    edit: "Edit",
    security: "Security",
    saveToAlbum: "Save to album",
    comments: "Comments",
    delete: "Delete",
    noPermissionDelete: "You do not have permission to delete this memory.",
    confirmDelete: "Delete this memory? This cannot be undone.",
    deleteFailed: "Could not delete memory.",
    loadFailed: "This memory could not load.",
  },
  es: {
    label: "RECUERDO",
    loading: "Cargando recuerdo...",
    notFound: "Recuerdo no encontrado",
    backLibrary: "Volver a biblioteca",
    untitled: "Recuerdo sin titulo",
    networkFeed: "Feed de red",
    private: "Privado",
    publicPage: "Pagina publica",
    mediaUnavailable: "Medio no disponible",
    mediaUnavailableText: "Este archivo puede faltar, ser privado o seguir procesandose.",
    noDescription: "Sin descripcion todavia.",
    aiNarration: "NARRACION DE VOZ IA",
    noNarration: "Todavia no hay narracion generada.",
    edit: "Editar",
    security: "Seguridad",
    saveToAlbum: "Guardar en album",
    comments: "Comentarios",
    delete: "Eliminar",
    noPermissionDelete: "No tienes permiso para eliminar este recuerdo.",
    confirmDelete: "Eliminar este recuerdo? Esto no se puede deshacer.",
    deleteFailed: "No se pudo eliminar el recuerdo.",
    loadFailed: "No se pudo cargar este recuerdo.",
  },
};

function MediaFallback({ labels }) {
  return (
    <div className="mobileMediaFallback">
      <ImageOff size={26} />
      <strong>{labels.mediaUnavailable}</strong>
      <span>{labels.mediaUnavailableText}</span>
    </div>
  );
}

function getMemoryMediaKind(memory = {}) {
  const safeMemory = memory || {};
  const type = safeMemory.type || "";
  const mimeType = safeMemory.media_mime_type || "";
  const mediaPath = String(safeMemory.media_path || "").toLowerCase();

  if (type === "photo" || mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|avif)$/.test(mediaPath)) {
    return "photo";
  }

  if (type === "video" || mimeType.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/.test(mediaPath)) {
    return "video";
  }

  if (type === "audio" || mimeType.startsWith("audio/") || /\.(mp3|wav|webm|m4a|aac|ogg)$/.test(mediaPath)) {
    return "audio";
  }

  return "document";
}

export default function MobileMemoryViewPage() {
  const params = useParams();
  const router = useRouter();
  const memoryId = params?.id;

  const [language, setLanguage] = useState("en");
  const [memory, setMemory] = useState(null);
  const [activity, setActivity] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [narrationUrl, setNarrationUrl] = useState("");
  const [mediaFailed, setMediaFailed] = useState(false);
  const [narrationFailed, setNarrationFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());

    function handleLanguageChange(event) {
      if (event.detail === "en" || event.detail === "es") {
        setLanguage(event.detail);
      }
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);
    return () => window.removeEventListener("vozeterna-language-change", handleLanguageChange);
  }, []);

  useEffect(() => {
    if (memoryId) {
      loadMemory(memoryId);
    }
  }, [memoryId]);

  async function loadMemory(id) {
    setLoading(true);
    setPageError("");
    setMediaUrl("");
    setNarrationUrl("");
    setMediaFailed(false);
    setNarrationFailed(false);

    try {
      const { data, error } = await supabase
        .from("memories")
        .select(
          "id, title, body, type, media_path, media_mime_type, feed_visibility, show_on_public_page, vault_id, network_id, created_by, narration_audio_path, created_at"
        )
        .eq("id", id)
        .maybeSingle();

      if (error) {
        setPageError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setMemory(null);
        setPageError(t.notFound);
        setLoading(false);
        return;
      }

      setMemory(data);

      const mediaPath = normalizeStoragePath(data.media_path);
      if (mediaPath) {
        const { data: signed, error: signedError } = await supabase.storage
          .from("family-media")
          .createSignedUrl(mediaPath, 3600);

        if (!signedError && signed?.signedUrl) {
          setMediaUrl(signed.signedUrl);
        } else {
          warnInvalidStoragePath("mobile memory media", data.media_path);
        }
      } else if (data.media_path) {
        warnInvalidStoragePath("mobile memory media", data.media_path);
      }

      const narrationPath = normalizeStoragePath(data.narration_audio_path);
      if (narrationPath) {
        const { data: signedNarration, error: narrationError } = await supabase.storage
          .from("family-media")
          .createSignedUrl(narrationPath, 3600);

        if (!narrationError && signedNarration?.signedUrl) {
          setNarrationUrl(signedNarration.signedUrl);
        } else {
          warnInvalidStoragePath("mobile memory narration", data.narration_audio_path);
        }
      } else if (data.narration_audio_path) {
        warnInvalidStoragePath("mobile memory narration", data.narration_audio_path);
      }

      const { data: activityData } = await supabase
        .from("network_activity")
        .select("id, actor_id, feed_visibility, is_commentable")
        .eq("memory_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setActivity(activityData || null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || "");
      setLoading(false);
    } catch (error) {
      setPageError(error.message || t.loadFailed);
      setLoading(false);
    }
  }

  async function deleteMemory() {
    if (!memory?.id) return;

    if (!isMemoryOwner(memory, activity, currentUserId)) {
      setPageError(t.noPermissionDelete);
      return;
    }

    const confirmed = window.confirm(t.confirmDelete);
    if (!confirmed) return;

    try {
      const mediaPath = normalizeStoragePath(memory.media_path);
      if (mediaPath) {
        await supabase.storage.from("family-media").remove([mediaPath]);
      }

      const narrationPath = normalizeStoragePath(memory.narration_audio_path);
      if (narrationPath) {
        await supabase.storage.from("family-media").remove([narrationPath]);
      }

      const { error } = await supabase.from("memories").delete().eq("id", memory.id);

      if (error) {
        setPageError(error.message);
        return;
      }

      router.push("/mobile/library");
    } catch (error) {
      setPageError(error.message || t.deleteFailed);
    }
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

  if (!memory) {
    return (
      <section className="mobileScreenStack">
        <div className="mobileScreenHero">
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.notFound}</h1>
          {pageError && <p>{pageError}</p>}

          <Link href="/mobile/library" className="mobilePrimaryButton">
            <ArrowLeft size={17} />
            {t.backLibrary}
          </Link>
        </div>
      </section>
    );
  }

  const mediaKind = getMemoryMediaKind(memory);
  const canManageMemory = isMemoryOwner(memory, activity, currentUserId);

  return (
    <section className="mobileScreenStack mobileMemoryDetailScreen">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{memory.title || t.untitled}</h1>

        <div className="mobileSecurityPills">
          <span>{memory.feed_visibility === "network" ? t.networkFeed : t.private}</span>
          {memory.show_on_public_page && <span>{t.publicPage}</span>}
        </div>
      </div>

      <section className="mobileMemoryDetailCard">
        {mediaKind === "photo" && mediaUrl && !mediaFailed && (
          <img
            src={mediaUrl}
            alt={memory.title || "Memory"}
            className="mobileMemoryDetailMedia"
            onError={() => setMediaFailed(true)}
          />
        )}

        {mediaKind === "video" && mediaUrl && !mediaFailed && (
          <video
            src={mediaUrl}
            controls
            playsInline
            className="mobileMemoryDetailMedia"
            onError={() => setMediaFailed(true)}
          />
        )}

        {mediaKind === "audio" && mediaUrl && !mediaFailed && (
          <audio
            src={mediaUrl}
            controls
            className="mobileMemoryDetailAudio"
            onError={() => setMediaFailed(true)}
          />
        )}

        {(!mediaUrl || mediaFailed) && <MediaFallback labels={t} />}

        <p>{memory.body || t.noDescription}</p>

        <div className="mobileNarrationBox">
          <p className="mobileCapsLabel">
            <Volume2 size={15} />
            {t.aiNarration}
          </p>

          {narrationUrl && !narrationFailed ? (
            <audio
              src={narrationUrl}
              controls
              className="mobileMemoryDetailAudio"
              onError={() => setNarrationFailed(true)}
            />
          ) : (
            <p className="mobileFormHelper">{t.noNarration}</p>
          )}
        </div>

        <div className="familyFeedActions">
          {canManageMemory && (
            <Link href={`/mobile/memories/${memory.id}/edit`} className="familyFeedCommentButton">
              <Edit3 size={16} />
              {t.edit}
            </Link>
          )}

          {canManageMemory && (
            <Link
              href={`/mobile/security?vaultId=${memory.vault_id || ""}&memoryId=${memory.id}`}
              className="familyFeedCommentButton"
            >
              <ShieldCheck size={16} />
              {t.security}
            </Link>
          )}

          <Link href={`/mobile/memories/${memory.id}/add-to-album`} className="familyFeedCommentButton">
            <FolderPlus size={16} />
            {t.saveToAlbum}
          </Link>

          {activity?.id && (
            <Link href={`/mobile/comments/${activity.id}`} className="familyFeedCommentButton">
              <MessageCircle size={16} />
              {t.comments}
            </Link>
          )}

          {canManageMemory && (
            <button type="button" className="mobileDeleteButton" onClick={deleteMemory}>
              <Trash2 size={15} />
              {t.delete}
            </button>
          )}
        </div>

        {pageError && <p className="mobileFormMessage">{pageError}</p>}
      </section>
    </section>
  );
}
