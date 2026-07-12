"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, QrCode, UserRound } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Profiles",
    title: "Family vaults",
    subtitle: "Manage the loved one vaults and private family archives connected to your account.",
    create: "Create profile",
    createText: "Add a new loved one or family vault.",
    connect: "Connect family",
    connectText: "Create a private invite link or QR code.",
    loading: "Loading profiles...",
    emptyTitle: "No family vaults yet",
    emptyText: "Create your first profile or upload a memory to automatically start your family vault.",
    uploadFirst: "Upload first memory",
    familyVault: "Family vault",
    privateArchive: "Private family archive.",
    qr: "QR invite",
  },
  es: {
    label: "Perfiles",
    title: "Bóvedas familiares",
    subtitle: "Administra perfiles de seres queridos y archivos familiares privados conectados a tu cuenta.",
    create: "Crear perfil",
    createText: "Agrega un ser querido o una bóveda familiar.",
    connect: "Conectar familia",
    connectText: "Crea un enlace privado o código QR.",
    loading: "Cargando perfiles...",
    emptyTitle: "Todavía no hay bóvedas",
    emptyText: "Crea tu primer perfil o sube un recuerdo para empezar tu bóveda familiar.",
    uploadFirst: "Subir primer recuerdo",
    familyVault: "Bóveda familiar",
    privateArchive: "Archivo familiar privado.",
    qr: "Invitar QR",
  },
};

export default function MobileProfilesPage() {
  const [language, setLanguage] = useState("en");
  const [vaults, setVaults] = useState([]);
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
    loadVaults();
  }, []);

  async function loadVaults() {
    setLoading(true);

    const { data, error } = await supabase
      .from("vaults")
      .select("id, network_id, title, subject_name, relationship_label, description, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Mobile profiles error:", error.message);
      setVaults([]);
      setLoading(false);
      return;
    }

    setVaults(data || []);
    setLoading(false);
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="mobileActionGrid">
        <Link href="/mobile/profiles/new" className="mobileActionCard primary">
          <Plus size={20} />
          <strong>{t.create}</strong>
          <p>{t.createText}</p>
        </Link>

        <Link href="/mobile/connect" className="mobileActionCard">
          <QrCode size={20} />
          <strong>{t.connect}</strong>
          <p>{t.connectText}</p>
        </Link>
      </section>

      <section className="mobileCardList">
        {loading && <p className="mobileEmptyText">{t.loading}</p>}

        {!loading && vaults.length === 0 && (
          <div className="mobileEmptyCard">
            <UserRound size={24} />
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>
            <Link href="/mobile/upload" className="mobileRecorderPrimary">
              {t.uploadFirst}
            </Link>
          </div>
        )}

        {vaults.map((vault) => (
          <Link href={`/mobile/profiles/${vault.id}`} className="mobileListCard" key={vault.id}>
            <strong>{vault.subject_name || vault.title}</strong>
            <span>{vault.relationship_label || t.familyVault}</span>
            <p>{vault.description || t.privateArchive}</p>

            <Link
              href={`/mobile/connect?networkId=${vault.network_id}&vaultId=${vault.id}`}
              className="mobileMiniAction"
            >
              <QrCode size={15} />
              {t.qr}
            </Link>
          </Link>`r`n        ))}
      </section>
    </section>
  );
}