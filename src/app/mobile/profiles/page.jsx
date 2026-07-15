"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, QrCode, UserRound } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { getVaultAccess, loadAccessibleVaults } from "../../../lib/mobileVault";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Vaults",
    title: "Vaults",
    subtitle: "Manage the memory vaults and private archives connected to your account.",
    create: "Create vault",
    createText: "Add a new memory vault.",
    connect: "Connect family",
    connectText: "Create a private invite link or QR code.",
    loading: "Loading vaults...",
    emptyTitle: "No vaults yet",
    emptyText: "Create your first vault or upload a memory to automatically start your family vault.",
    uploadFirst: "Upload first memory",
    familyVault: "Family vault",
    privateArchive: "Private family archive.",
    qr: "QR invite",
  },
  es: {
    label: "Bovedas",
    title: "Bovedas",
    subtitle: "Administra bovedas de recuerdos y archivos privados conectados a tu cuenta.",
    create: "Crear boveda",
    createText: "Agrega una nueva boveda de recuerdos.",
    connect: "Conectar familia",
    connectText: "Crea un enlace privado o código QR.",
    loading: "Cargando bovedas...",
    emptyTitle: "Todavia no hay bovedas",
    emptyText: "Crea tu primera boveda o sube un recuerdo para empezar tu boveda familiar.",
    uploadFirst: "Subir primer recuerdo",
    familyVault: "Boveda familiar",
    privateArchive: "Archivo familiar privado.",
    qr: "Invitar QR",
  },
};

export default function MobileProfilesPage() {
  const [language, setLanguage] = useState("en");
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = copy[language] || copy.en;
  const canInviteFromAnyVault = vaults.some((vault) => vault.access?.canManage);

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setVaults([]);
      setLoading(false);
      return;
    }

    try {
      const accessibleVaults = await loadAccessibleVaults(
        supabase,
        user,
        "id, network_id, created_by, title, subject_name, relationship_label, description, created_at"
      );
      const vaultsWithAccess = await Promise.all(
        accessibleVaults.map(async (vault) => ({
          ...vault,
          access: await getVaultAccess(supabase, user, vault),
        }))
      );

      setVaults(vaultsWithAccess);
    } catch (error) {
      console.error("Mobile profiles error:", error.message);
      setVaults([]);
    }

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

        {canInviteFromAnyVault && (
          <Link href="/mobile/connect" className="mobileActionCard">
            <QrCode size={20} />
            <strong>{t.connect}</strong>
            <p>{t.connectText}</p>
          </Link>
        )}
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
          <Link
            href={`/mobile/profiles/${vault.id}`}
            className="mobileListCard"
            key={vault.id}
          >
            <strong>{vault.subject_name || vault.title}</strong>
            <span>{vault.relationship_label || t.familyVault}</span>
            <p>{vault.description || t.privateArchive}</p>

            {vault.access?.canManage && (
              <span
                className="mobileMiniAction"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  window.location.href = `/mobile/connect?networkId=${vault.network_id}&vaultId=${vault.id}`;
                }}
              >
                <QrCode size={15} />
                {t.qr}
              </span>
            )}
          </Link>
        ))}
      </section>
    </section>
  );
}
