"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QrCode, UploadCloud } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Profile",
    loading: "Loading profile...",
    notFound: "Profile not found.",
    memories: "Memories",
    empty: "No memories connected yet.",
    upload: "Add memory",
    invite: "QR invite",
    privateArchive: "Private family archive.",
  },
  es: {
    label: "Perfil",
    loading: "Cargando perfil...",
    notFound: "Perfil no encontrado.",
    memories: "Recuerdos",
    empty: "Todavía no hay recuerdos conectados.",
    upload: "Agregar recuerdo",
    invite: "Invitar QR",
    privateArchive: "Archivo familiar privado.",
  },
};

export default function MobileProfileDetailPage({ params }) {
  const [language, setLanguage] = useState("en");
  const [vault, setVault] = useState(null);
  const [memories, setMemories] = useState([]);
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
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    const { data: vaultData } = await supabase
      .from("vaults")
      .select("id, network_id, title, subject_name, relationship_label, description, created_at")
      .eq("id", params.id)
      .maybeSingle();

    if (!vaultData) {
      setVault(null);
      setLoading(false);
      return;
    }

    const { data: memoryData } = await supabase
      .from("memories")
      .select("id, title, body, type, created_at")
      .eq("vault_id", params.id)
      .order("created_at", { ascending: false });

    setVault(vaultData);
    setMemories(memoryData || []);
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
          </div>
        ) : (
          memories.map((memory) => (
            <article className="mobileListCard" key={memory.id}>
              <strong>{memory.title || "Memory"}</strong>
              <span>{memory.type}</span>
              {memory.body && <p>{memory.body}</p>}
            </article>
          ))
        )}
      </section>
    </section>
  );
}