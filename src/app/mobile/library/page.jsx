"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Image as ImageIcon,
  Mic2,
  Plus,
  UploadCloud,
  Video,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { normalizeStoragePath, warnInvalidStoragePath } from "../../../lib/storagePaths";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";
import MobileMemoryActions from "../../../components/mobile/MobileMemoryActions";

const copy = {
  en: {
    label: "Library",
    title: "Memory Library",
    subtitle: "Review photos, audio, video, notes, and keepsakes saved in your vault.",
    add: "Add memory",
    loading: "Loading memories...",
    emptyTitle: "No memories yet",
    emptyText: "Record a voice message or upload a photo to begin.",
    uploadFirst: "Upload first memory",
    private: "Private",
    network: "Network feed",
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
    label: "Biblioteca",
    title: "Biblioteca de recuerdos",
    subtitle: "Revisa fotos, audio, video, notas y recuerdos guardados en tu bóveda.",
    add: "Agregar recuerdo",
    loading: "Cargando recuerdos...",
    emptyTitle: "Todavía no hay recuerdos",
    emptyText: "Graba un mensaje de voz o sube una foto para empezar.",
    uploadFirst: "Subir primer recuerdo",
    private: "Privado",
    network: "Feed de red",
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

export default function MobileLibraryPage() {
  const [language, setLanguage] = useState("en");
  const [memories, setMemories] = useState([]);
  const [activitiesByMemory, setActivitiesByMemory] = useState({});
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);

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
    loadMemories();
  }, []);

  async function loadMemories() {
    setLoading(true);

    const { data, error } = await supabase
      .from("memories")
      .select("id, title, body, type, media_path, media_mime_type, media_size_bytes, feed_visibility, created_at, vault_id, network_id")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Mobile library error:", error.message);
      setMemories([]);
      setLoading(false);
      return;
    }

    const rows = data || [];
    const urls = {};

    await Promise.all(
      rows.map(async (memory) => {
        const mediaPath = normalizeStoragePath(memory.media_path);
        if (!mediaPath) {
          if (memory.media_path) warnInvalidStoragePath("mobile library media", memory.media_path);
          return;
        }

        const { data: signed, error: signedError } = await supabase.storage
          .from("family-media")
          .createSignedUrl(mediaPath, 3600);

        if (!signedError && signed?.signedUrl) {
          urls[memory.id] = signed.signedUrl;
        } else {
          warnInvalidStoragePath("mobile library media", memory.media_path);
        }
      })
    );

    const memoryIds = rows.map((memory) => memory.id);

    let activityMap = {};

    if (memoryIds.length > 0) {
      const { data: activityRows } = await supabase
        .from("network_activity")
        .select("id, memory_id, feed_visibility, is_commentable")
        .in("memory_id", memoryIds);

      activityMap = (activityRows || []).reduce((map, item) => {
        map[item.memory_id] = item;
        return map;
      }, {});
    }

    setSignedUrls(urls);
    setActivitiesByMemory(activityMap);
    setMemories(rows);
    setLoading(false);
  }

  function removeDeleted(id) {
    setMemories((current) => current.filter((memory) => memory.id !== id));
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <Link href="/mobile/upload" className="mobilePrimaryButton">
          <Plus size={17} />
          {t.add}
        </Link>
      </div>

      <div className="mobileMemoryGrid">
        {loading && <p className="mobileEmptyText">{t.loading}</p>}

        {!loading && memories.length === 0 && (
          <div className="mobileEmptyCard">
            <UploadCloud size={24} />
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>
            <Link href="/mobile/upload" className="mobileRecorderPrimary">
              {t.uploadFirst}
            </Link>
          </div>
        )}

        {memories.map((memory) => {
          const Icon = getMemoryIcon(memory.type);
          const url = signedUrls[memory.id];
          const activity = activitiesByMemory[memory.id];

          return (
            <article className="mobileMemoryCard" key={memory.id}>
              <div className="mobileMemoryCardTopActions">
                <span>{memory.feed_visibility === "network" ? t.network : t.private}</span>
                <MobileMemoryActions
                  memory={memory}
                  activityId={activity?.id}
                  labels={t.actions}
                  onDeleted={removeDeleted}
                />
              </div>

              {memory.type === "photo" && url && (
                <img src={url} alt={memory.title || "Memory"} />
              )}

              {memory.type === "audio" && url && (
                <audio src={url} controls />
              )}

              {memory.type === "video" && url && (
                <video src={url} controls playsInline />
              )}

              {!url && (
                <div className="mobileMemoryIconOnly">
                  <Icon size={24} />
                </div>
              )}

              <div>
                <strong>{memory.title || "Memory"}</strong>
                {memory.body && <p>{memory.body}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
