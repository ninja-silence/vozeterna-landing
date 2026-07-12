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
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";
import ShareMemoryButton from "../../../components/social/ShareMemoryButton";

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
    share: {
      share: "Share",
      shared: "Shared",
      copied: "Copied",
      copyManually: "Copy manually",
      textPrefix: "A private VozEterna memory:",
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
    share: {
      share: "Compartir",
      shared: "Compartido",
      copied: "Copiado",
      copyManually: "Copiar manualmente",
      textPrefix: "Un recuerdo privado de VozEterna:",
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
      .select("id, title, body, type, media_path, media_mime_type, media_size_bytes, created_at, vault_id, network_id")
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
        if (!memory.media_path) return;

        const { data: signed } = await supabase.storage
          .from("family-media")
          .createSignedUrl(memory.media_path, 3600);

        if (signed?.signedUrl) {
          urls[memory.id] = signed.signedUrl;
        }
      })
    );

    setSignedUrls(urls);
    setMemories(rows);
    setLoading(false);
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

          return (
            <article className="mobileMemoryCard" key={memory.id}>
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
                <span>{t.private}</span>
                <strong>{memory.title || "Memory"}</strong>
                {memory.body && <p>{memory.body}</p>}

                <ShareMemoryButton
                  className="familyFeedShare"
                  title={memory.title || "VozEterna memory"}
                  text={`${t.share.textPrefix} ${memory.title || "Memory"}`}
                  url={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/mobile/library`
                      : ""
                  }
                  labels={t.share}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}