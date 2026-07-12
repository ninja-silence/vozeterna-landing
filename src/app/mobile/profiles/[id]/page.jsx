"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  Mic2,
  QrCode,
  UploadCloud,
  Video,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";
import ShareMemoryButton from "../../../../components/social/ShareMemoryButton";

const copy = {
  en: {
    label: "Profile",
    loading: "Loading profile...",
    notFound: "Profile not found.",
    notFoundText: "We could not find this vault, or you may not have access to it.",
    backProfiles: "Back to profiles",
    memories: "Memories",
    empty: "No memories connected yet.",
    upload: "Add memory",
    invite: "QR invite",
    privateArchive: "Private family archive.",
    familyVault: "Family vault",
    share: {
      share: "Share",
      shared: "Shared",
      copied: "Copied",
      copyManually: "Copy manually",
      textPrefix: "A private VozEterna memory:",
    },
  },
  es: {
    label: "Perfil",
    loading: "Cargando perfil...",
    notFound: "Perfil no encontrado.",
    notFoundText: "No pudimos encontrar esta bóveda, o quizá no tienes acceso.",
    backProfiles: "Volver a perfiles",
    memories: "Recuerdos",
    empty: "Todavía no hay recuerdos conectados.",
    upload: "Agregar recuerdo",
    invite: "Invitar QR",
    privateArchive: "Archivo familiar privado.",
    familyVault: "Bóveda familiar",
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

export default function MobileProfileDetailPage() {
  const params = useParams();
  const vaultId = params?.id;

  const [language, setLanguage] = useState("en");
  const [vault, setVault] = useState(null);
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
    if (vaultId) {
      loadProfile(vaultId);
    }
  }, [vaultId]);

  async function loadProfile(id) {
    setLoading(true);

    const { data: vaultData, error: vaultError } = await supabase
      .from("vaults")
      .select("id, network_id, title, subject_name, relationship_label, description, created_at")
      .eq("id", id)
      .maybeSingle();

    if (vaultError) {
      console.error("Mobile profile detail error:", vaultError.message);
      setVault(null);
      setMemories([]);
      setLoading(false);
      return;
    }

    if (!vaultData) {
      setVault(null);
      setMemories([]);
      setLoading(false);
      return;
    }

    const { data: memoryData, error: memoryError } = await supabase
      .from("memories")
      .select("id, title, body, type, media_path, media_mime_type, created_at")
      .eq("vault_id", id)
      .order("created_at", { ascending: false });

    if (memoryError) {
      console.error("Mobile profile memories error:", memoryError.message);
    }

    const rows = memoryData || [];
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

    setVault(vaultData);
    setMemories(rows);
    setSignedUrls(urls);
    setLoading(false);
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
          <Link href="/mobile/profiles" className="mobilePrimaryButton">
            {t.backProfiles}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{vault.subject_name || vault.title}</h1>
        <p>{vault.description || t.privateArchive}</p>
      </div>

      <section className="mobileActionGrid">
        <Link href="/mobile/upload" className="mobileActionCard primary">
          <UploadCloud size={20} />
          <strong>{t.upload}</strong>
        </Link>

        <Link
          href={`/mobile/connect?networkId=${vault.network_id}&vaultId=${vault.id}`}
          className="mobileActionCard"
        >
          <QrCode size={20} />
          <strong>{t.invite}</strong>
        </Link>
      </section>

      <section className="mobileCardList">
        <p className="mobileCapsLabel">{t.memories}</p>

        {memories.length === 0 ? (
          <div className="mobileEmptyCard">
            <p>{t.empty}</p>
            <Link href="/mobile/upload" className="mobileRecorderPrimary">
              {t.upload}
            </Link>
          </div>
        ) : (
          memories.map((memory) => {
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
                  <span>{vault.relationship_label || t.familyVault}</span>
                  <strong>{memory.title || "Memory"}</strong>
                  {memory.body && <p>{memory.body}</p>}

                  <ShareMemoryButton
                    className="familyFeedShare"
                    title={memory.title || "VozEterna memory"}
                    text={`${t.share.textPrefix} ${memory.title || "Memory"}`}
                    url={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/mobile/profiles/${vault.id}`
                        : ""
                    }
                    labels={t.share}
                  />
                </div>
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}