"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  MessageCircle,
  Mic2,
  UploadCloud,
  UserRound,
  Video,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../mobile/mobileLanguage";
import ShareMemoryButton from "./ShareMemoryButton";

const copy = {
  en: {
    label: "Family Feed",
    loadingTitle: "Loading updates...",
    title: "Recent family activity",
    subtitle: "Private updates from vaults you belong to.",
    unavailableTitle: "Feed unavailable",
    unavailableText: "We could not load the family feed yet.",
    tryAgain: "Try again",
    emptyTitle: "Your family is waiting for your story.",
    emptyText:
      "This private feed will come alive when you or invited family members add the first memory, photo, voice note, or reflection.",
    recordFirst: "Record the first memory",
    justNow: "Just now",
    agoMinute: "m ago",
    agoHour: "h ago",
    agoDay: "d ago",
    noDescription: "No description yet.",
    labels: {
      reflection_added: "New reflection",
      voice_added: "Voice memory",
      video_added: "Video memory",
      photo_added: "Photo memory",
      profile_added: "Profile update",
      memory_added: "Family update",
      default: "Family update",
    },
    share: {
      share: "Share",
      shared: "Shared",
      copied: "Copied",
      copyManually: "Copy manually",
      textPrefix: "A private VozEterna family update:",
    },
  },
  es: {
    label: "Red familiar",
    loadingTitle: "Cargando actualizaciones...",
    title: "Actividad familiar reciente",
    subtitle: "Actualizaciones privadas de las bóvedas a las que perteneces.",
    unavailableTitle: "Feed no disponible",
    unavailableText: "Todavía no pudimos cargar la actividad familiar.",
    tryAgain: "Intentar de nuevo",
    emptyTitle: "Tu familia está esperando tu historia.",
    emptyText:
      "Este feed privado cobrará vida cuando tú o tus familiares invitados agreguen el primer recuerdo, foto, nota de voz o reflexión.",
    recordFirst: "Grabar el primer recuerdo",
    justNow: "Ahora mismo",
    agoMinute: "min",
    agoHour: "h",
    agoDay: "d",
    noDescription: "Sin descripción todavía.",
    labels: {
      reflection_added: "Nueva reflexión",
      voice_added: "Recuerdo de voz",
      video_added: "Recuerdo en video",
      photo_added: "Recuerdo con foto",
      profile_added: "Actualización de perfil",
      memory_added: "Actualización familiar",
      default: "Actualización familiar",
    },
    share: {
      share: "Compartir",
      shared: "Compartido",
      copied: "Copiado",
      copyManually: "Copiar manualmente",
      textPrefix: "Una actualización familiar privada de VozEterna:",
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

function FamilyFeedSkeleton({ t }) {
  return (
    <section className="familyFeedPanel">
      <div className="familyFeedHeader">
        <p>{t.label}</p>
        <h2>{t.loadingTitle}</h2>
        <span className="skeletonLine skeletonText" />
      </div>

      <div className="familyFeedList">
        {[1, 2, 3].map((item) => (
          <div className="familyFeedMemoryCard skeletonItem" key={item}>
            <span className="skeletonLine skeletonTitle" />
            <span className="skeletonLine skeletonText" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FamilyActivityFeed({ limit = 20 }) {
  const [language, setLanguage] = useState("en");
  const [activities, setActivities] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());

    function handleLanguageChange(event) {
      if (event.detail === "en" || event.detail === "es") {
        setLanguage(event.detail);
      }
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("vozeterna-language-change", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    loadActivity();
  }, []);

  async function loadActivity() {
    setLoading(true);
    setFeedError("");

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
        memories (
          id,
          title,
          body,
          type,
          media_path,
          media_mime_type,
          created_at
        ),
        vaults (
          id,
          title,
          subject_name,
          relationship_label
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Family feed error:", error.message);
      setActivities([]);
      setFeedError(t.unavailableText);
      setLoading(false);
      return;
    }

    const rows = data || [];
    const urls = {};

    await Promise.all(
      rows.map(async (activity) => {
        const path = activity.memories?.media_path;
        if (!path) return;

        const { data: signed } = await supabase.storage
          .from("family-media")
          .createSignedUrl(path, 3600);

        if (signed?.signedUrl) {
          urls[activity.id] = signed.signedUrl;
        }
      })
    );

    setSignedUrls(urls);
    setActivities(rows);
    setLoading(false);
  }

  if (loading) {
    return <FamilyFeedSkeleton t={t} />;
  }

  return (
    <section className="familyFeedPanel">
      <div className="familyFeedHeader">
        <p>{t.label}</p>
        <h2>{t.title}</h2>
        <span>{t.subtitle}</span>
      </div>

      {feedError ? (
        <div className="familyFeedEmpty">
          <strong>{t.unavailableTitle}</strong>
          <p>{feedError}</p>
          <button type="button" onClick={loadActivity} className="familyFeedRetry">
            {t.tryAgain}
          </button>
        </div>
      ) : activities.length === 0 ? (
        <div className="familyFeedEmpty familyFeedFirstMemory">
          <span className="familyFeedEmptyIcon">
            <Mic2 size={22} strokeWidth={2.35} />
          </span>

          <strong>{t.emptyTitle}</strong>
          <p>{t.emptyText}</p>
          <Link href="/mobile/record">{t.recordFirst}</Link>
        </div>
      ) : (
        <div className="familyFeedList">
          {activities.map((activity) => {
            const memory = activity.memories;
            const Icon = getActivityIcon(activity.activity_type);
            const activityTitle =
              memory?.title ||
              activity.title ||
              getActivityLabel(activity.activity_type, t);
            const description = memory?.body || t.noDescription;
            const url = signedUrls[activity.id];
            const memoryType = memory?.type;

            return (
              <article className="familyFeedMemoryCard" key={activity.id}>
                <div className="familyFeedMemoryTop">
                  <span className="familyFeedIcon">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>

                  <div>
                    <strong>{activityTitle}</strong>
                    <p>{formatActivityDate(activity.created_at, t, language)}</p>
                  </div>
                </div>

                {memoryType === "photo" && url && (
                  <img className="familyFeedMediaPreview" src={url} alt={activityTitle} />
                )}

                {memoryType === "video" && url && (
                  <video className="familyFeedMediaPreview" src={url} controls playsInline />
                )}

                {memoryType === "audio" && url && (
                  <audio className="familyFeedAudioPreview" src={url} controls />
                )}

                <p className="familyFeedDescription">{description}</p>

                <ShareMemoryButton
                  className="familyFeedShare"
                  title={activityTitle}
                  text={`${t.share.textPrefix} ${activityTitle}`}
                  url={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/mobile/feed`
                      : ""
                  }
                  labels={t.share}
                />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}