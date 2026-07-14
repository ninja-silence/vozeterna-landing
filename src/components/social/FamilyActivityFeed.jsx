"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  ImageOff,
  MessageCircle,
  Mic2,
  UploadCloud,
  UserRound,
  Video,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { isMemoryOwner } from "../../lib/memoryPermissions";
import { normalizeStoragePath, warnInvalidStoragePath } from "../../lib/storagePaths";
import { getInitialMobileLanguage } from "../mobile/mobileLanguage";
import MobileMemoryActions from "../mobile/MobileMemoryActions";

const copy = {
  en: {
    loading: "Loading feed...",
    emptyFamily: "No family feed activity yet.",
    emptyFriend: "No friend feed activity yet.",
    recordFirst: "Record first memory",
    comments: "Comments",
    commentSingular: "1 comment",
    commentPlural: "comments",
    feedError: "Feed error",
    retry: "Retry",
    mediaUnavailable: "Media unavailable",
    noDescription: "No description yet.",
    justNow: "Just now",
    agoMinute: "m ago",
    agoHour: "h ago",
    agoDay: "d ago",
    labels: {
      reflection_added: "New reflection",
      voice_added: "Voice memory",
      video_added: "Video memory",
      photo_added: "Photo memory",
      profile_added: "Profile update",
      memory_added: "Memory update",
      default: "Network update",
    },
    actions: {
      view: "View",
      edit: "Edit",
      security: "Security",
      delete: "Delete",
      share: "Share",
      copied: "Copied",
      comments: "Comments",
      confirmDelete: "Delete this memory? This cannot be undone.",
      deleteFailed: "Could not delete memory.",
    },
  },
  es: {
    loading: "Cargando feed...",
    emptyFamily: "Todavia no hay actividad en el feed familiar.",
    emptyFriend: "Todavia no hay actividad en el feed de amigos.",
    recordFirst: "Grabar primer recuerdo",
    comments: "Comentarios",
    commentSingular: "1 comentario",
    commentPlural: "comentarios",
    feedError: "Error del feed",
    retry: "Reintentar",
    mediaUnavailable: "Medio no disponible",
    noDescription: "Sin descripcion todavia.",
    justNow: "Ahora mismo",
    agoMinute: "min",
    agoHour: "h",
    agoDay: "d",
    labels: {
      reflection_added: "Nueva reflexion",
      voice_added: "Recuerdo de voz",
      video_added: "Recuerdo en video",
      photo_added: "Recuerdo con foto",
      profile_added: "Actualizacion de perfil",
      memory_added: "Actualizacion de recuerdo",
      default: "Actualizacion de red",
    },
    actions: {
      view: "Ver",
      edit: "Editar",
      security: "Seguridad",
      delete: "Eliminar",
      share: "Compartir",
      copied: "Copiado",
      comments: "Comentarios",
      confirmDelete: "Eliminar este recuerdo? Esto no se puede deshacer.",
      deleteFailed: "No se pudo eliminar el recuerdo.",
    },
  },
};

function getActivityIcon(type) {
  if (type === "reflection_added") return MessageCircle;
  if (type === "voice_added") return Mic2;
  if (type === "video_added") return Video;
  if (type === "photo_added") return ImageIcon;
  if (type === "profile_added") return UserRound;
  return UploadCloud;
}

function getActivityLabel(type, t) {
  return t.labels[type] || t.labels.default;
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

  return "file";
}

function formatActivityDate(dateString, t, language) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return t.justNow;

  if (language === "es") {
    if (diffMinutes < 60) return `hace ${diffMinutes} ${t.agoMinute}`;
    if (diffHours < 24) return `hace ${diffHours} ${t.agoHour}`;
    if (diffDays < 7) return `hace ${diffDays} ${t.agoDay}`;
    return date.toLocaleDateString("es-MX");
  }

  if (diffMinutes < 60) return `${diffMinutes}${t.agoMinute}`;
  if (diffHours < 24) return `${diffHours}${t.agoHour}`;
  if (diffDays < 7) return `${diffDays}${t.agoDay}`;

  return date.toLocaleDateString("en-US");
}

export default function FamilyActivityFeed({ feedType = "family", limit = 30 }) {
  const [language, setLanguage] = useState("en");
  const [activities, setActivities] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [failedMediaIds, setFailedMediaIds] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");

  const t = copy[language] || copy.en;
  const resolvedType = feedType === "friend" ? "friend" : "family";
  const filteredActivities = activities.filter((activity) => {
    const relationshipType = activity?.relationship_type;

    if (resolvedType === "friend") {
      return relationshipType === "friend";
    }

    return relationshipType === "family" || !relationshipType;
  });

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
    loadActivity();
  }, [resolvedType]);

  async function loadActivity() {
    setLoading(true);
    setFeedError("");
    setFailedMediaIds([]);
    setCommentCounts({});

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      setCurrentUserId("");
      setActivities([]);
      setSignedUrls({});
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { data: memberships, error: membershipError } = await supabase
      .from("network_members")
      .select("network_id")
      .eq("user_id", user.id);

    if (membershipError) {
      setFeedError(membershipError.message);
      setActivities([]);
      setSignedUrls({});
      setLoading(false);
      return;
    }

    const membershipNetworkIds = [
      ...new Set((memberships || []).map((membership) => membership.network_id).filter(Boolean)),
    ];

    if (membershipNetworkIds.length === 0) {
      setActivities([]);
      setSignedUrls({});
      setLoading(false);
      return;
    }

    const { data: networks, error: networkError } = await supabase
      .from("networks")
      .select("id, type, name")
      .in("id", membershipNetworkIds)
      .eq("type", resolvedType)
      .eq("is_archived", false);

    if (networkError) {
      setFeedError(networkError.message);
      setActivities([]);
      setSignedUrls({});
      setLoading(false);
      return;
    }

    const networkRows = networks || [];
    const networkTypeById = new Map(
      networkRows
        .filter((network) => network?.id)
        .map((network) => [network.id, network?.type === "friend" ? "friend" : "family"])
    );
    const networkIds = networkRows.map((network) => network?.id).filter(Boolean);

    if (networkIds.length === 0) {
      setActivities([]);
      setSignedUrls({});
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("network_activity")
      .select(`
        id,
        activity_type,
        title,
        created_at,
        memory_id,
        vault_id,
        network_id,
        actor_id,
        feed_visibility,
        is_commentable,
        memories (
          id,
          title,
          body,
          type,
          media_path,
          media_mime_type,
          created_by,
          feed_visibility,
          show_on_public_page,
          vault_id,
          network_id,
          created_at
        ),
        vaults (
          id,
          title,
          subject_name,
          relationship_label
        )
      `)
      .in("network_id", networkIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      setFeedError(error.message);
      setActivities([]);
      setLoading(false);
      return;
    }

    const rows = (data || []).map((activity) => ({
      ...activity,
      relationship_type:
        activity.relationship_type ||
        activity.memories?.relationship_type ||
        networkTypeById.get(activity.network_id),
    }));
    const urls = {};
    const activityIds = rows.map((activity) => activity.id).filter(Boolean);

    if (activityIds.length > 0) {
      const { data: commentRows } = await supabase
        .from("network_comments")
        .select("activity_id")
        .in("activity_id", activityIds)
        .is("deleted_at", null);

      const counts = (commentRows || []).reduce((map, row) => {
        if (row.activity_id) {
          map[row.activity_id] = (map[row.activity_id] || 0) + 1;
        }
        return map;
      }, {});

      setCommentCounts(counts);
    }

    await Promise.all(
      rows.map(async (activity) => {
        const rawPath = activity?.memories?.media_path;
        const path = normalizeStoragePath(rawPath);
        if (!path) {
          if (rawPath) warnInvalidStoragePath("family feed media", rawPath);
          return;
        }

        const { data: signed, error: signedError } = await supabase.storage
          .from("family-media")
          .createSignedUrl(path, 3600);

        if (!signedError && signed?.signedUrl) {
          urls[activity.id] = signed.signedUrl;
        } else {
          warnInvalidStoragePath("family feed media", rawPath);
        }
      })
    );

    setActivities(rows);
    setSignedUrls(urls);
    setLoading(false);
  }

  function removeDeleted(memoryId) {
    setActivities((current) => current.filter((activity) => activity.memory_id !== memoryId));
  }

  function markMediaFailed(activityId) {
    setFailedMediaIds((current) => (current.includes(activityId) ? current : [...current, activityId]));
  }

  return (
    <section className="familyFeedPanel">
      {loading ? (
        <div className="mobileFeedEmptyState">
          <p>{t.loading}</p>
        </div>
      ) : feedError ? (
        <div className="mobileFeedEmptyState">
          <strong>{t.feedError}</strong>
          <p>{feedError}</p>
          <button type="button" onClick={loadActivity} className="familyFeedRetry">
            {t.retry}
          </button>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="mobileFeedEmptyState familyFeedFirstMemory">
          <strong>{resolvedType === "family" ? t.emptyFamily : t.emptyFriend}</strong>
          <Link href="/mobile/record" className="mobileFeedEmptyAction">
            <Mic2 size={22} strokeWidth={2.35} />
            <span>{t.recordFirst}</span>
          </Link>
        </div>
      ) : (
        <div className="familyFeedList">
          {filteredActivities.map((activity) => {
            const memory = activity.memories;
            const Icon = getActivityIcon(activity?.activity_type);
            const activityTitle =
              memory?.title ||
              activity?.title ||
              getActivityLabel(activity?.activity_type, t);
            const description = memory?.body || t.noDescription;
            const url = signedUrls[activity.id];
            const mediaKind = getMemoryMediaKind(memory);
            const hasMedia = Boolean(memory?.media_path);
            const mediaFailed = failedMediaIds.includes(activity.id);
            const showMediaFallback = hasMedia && (!url || mediaFailed || mediaKind === "file");
            const canManageMemory = isMemoryOwner(memory, activity, currentUserId);
            const commentCount = commentCounts[activity.id] || 0;
            const commentLabel =
              commentCount === 1
                ? t.commentSingular
                : commentCount > 1
                  ? `${commentCount} ${t.commentPlural}`
                  : t.comments;

            return (
              <article className="familyFeedMemoryCard" key={activity.id}>
                <div className="familyFeedMemoryTop">
                  <span className="familyFeedIcon">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>

                  <div>
                    <strong>{activityTitle}</strong>
                    <p className="familyFeedTimestamp">
                      {formatActivityDate(activity.created_at, t, language)}
                    </p>
                  </div>

                  {memory?.id && (
                    <MobileMemoryActions
                      memory={memory}
                      activityId={activity.id}
                      activity={activity}
                      currentUserId={currentUserId}
                      canManage={canManageMemory}
                      labels={t.actions}
                      onDeleted={removeDeleted}
                    />
                  )}
                </div>

                {mediaKind === "photo" && url && !mediaFailed && (
                  <img
                    className="familyFeedMediaPreview"
                    src={url}
                    alt={activityTitle}
                    onError={() => markMediaFailed(activity.id)}
                  />
                )}

                {mediaKind === "video" && url && !mediaFailed && (
                  <video
                    className="familyFeedMediaPreview"
                    src={url}
                    controls
                    playsInline
                    onError={() => markMediaFailed(activity.id)}
                  />
                )}

                {mediaKind === "audio" && url && !mediaFailed && (
                  <audio
                    className="familyFeedAudioPreview"
                    src={url}
                    controls
                    onError={() => markMediaFailed(activity.id)}
                  />
                )}

                {showMediaFallback && (
                  <div className="familyFeedMediaFallback">
                    <ImageOff size={20} />
                    <strong>{t.mediaUnavailable}</strong>
                  </div>
                )}

                <p className="familyFeedDescription">{description}</p>

                <div className="familyFeedActions">
                  {activity.feed_visibility === "network" && activity.is_commentable && (
                    <Link href={`/mobile/comments/${activity.id}`} className="familyFeedCommentButton">
                      <MessageCircle size={16} />
                      {commentLabel}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
