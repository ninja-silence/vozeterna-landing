"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { getStoredAppLanguage } from "../../lib/appLanguage";

function formatStorage(bytes) {
  const safeBytes = Number(bytes) || 0;

  if (safeBytes <= 0) return "0 KB";

  if (safeBytes < 1024 * 1024) {
    return `${(safeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

const copy = {
  en: {
    back: "Back to VozEterna App",
    familyLegacy: "Family Legacy",
    title: "Family Legacy Vault",
    subtitle:
      "Preserve voice memories, video messages, photos, prayers, stories, and family-approved memorial moments in one private legacy vault.",
    createProfile: "Create profile",
    recordMemory: "Record memory",
    protectedVault: "Protected Vault",
    privateDefault: "Private by default",
    storageUsed: "Storage used",
    storageLimit: "of 50 MB",
    vaultProgress: "Vault Progress",
    profiles: "Loved Ones",
    memories: "Saved Items",
    publicPages: "Memorial Pages",
    albums: "Albums",
    consent: "Consent",
    privacy: "Privacy",
    active: "Active",
    protected: "Protected",
    profileText: "Manage profiles for family and close friends.",
    memoryText: "Photos, audio, video, notes, and keepsakes saved.",
    publicText: "Public memorial pages enabled for sharing.",
    albumsText: "Curated memory collections.",
    consentText: "Signed consent records.",
    privacyText: "Private by default.",
    checklist: [
      "Consent signed",
      "Loved One profiles",
      "Add first memory",
      "Enable public page",
      "Review recordings",
      "Approve for public page",
    ],
  },
  es: {
    back: "Volver a VozEterna App",
    familyLegacy: "Legado Familiar",
    title: "Bóveda de Legado Familiar",
    subtitle:
      "Preserva recuerdos de voz, mensajes en video, fotos, oraciones, historias y momentos aprobados por la familia en una bóveda privada.",
    createProfile: "Crear perfil",
    recordMemory: "Grabar recuerdo",
    protectedVault: "Bóveda protegida",
    privateDefault: "Privada por defecto",
    storageUsed: "Almacenamiento usado",
    storageLimit: "de 50 MB",
    vaultProgress: "Progreso de la bóveda",
    profiles: "Seres queridos",
    memories: "Recuerdos",
    publicPages: "Páginas memoriales",
    albums: "Álbumes",
    consent: "Consentimiento",
    privacy: "Privacidad",
    active: "Activa",
    protected: "Protegida",
    profileText: "Administra perfiles de familia y amigos cercanos.",
    memoryText: "Fotos, audio, video, notas y recuerdos guardados.",
    publicText: "Páginas memoriales públicas habilitadas.",
    albumsText: "Colecciones de recuerdos.",
    consentText: "Registros de consentimiento firmados.",
    privacyText: "Privada por defecto.",
    checklist: [
      "Consentimiento firmado",
      "Perfiles de seres queridos",
      "Agregar primer recuerdo",
      "Activar página pública",
      "Revisar grabaciones",
      "Aprobar para página pública",
    ],
  },
};

export default function MobileAppPage() {
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    profiles: 0,
    memories: 0,
    publicPages: 0,
    albums: 0,
    consent: 0,
    storageBytes: 0,
  });

  const t = copy[language] || copy.en;

  const storageLimitBytes = 50 * 1024 * 1024;
  const storageBytes = Number(stats.storageBytes) || 0;
  const storagePercent = Math.min(
    100,
    Math.max(0, Math.round((storageBytes / storageLimitBytes) * 100))
  );
  const storageDisplay = loadingStats ? "—" : formatStorage(storageBytes);

  useEffect(() => {
    setLanguage(getStoredAppLanguage());
  }, []);

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (!currentUser) {
        setLoadingStats(false);
        return;
      }

      const [
        profilesResult,
        memoriesResult,
        publicResult,
        albumsResult,
        consentResult,
        storageResult,
      ] = await Promise.all([
        supabase.from("loved_ones").select("id", { count: "exact", head: true }),
        supabase.from("media_assets").select("id", { count: "exact", head: true }),
        supabase.from("loved_ones").select("id", { count: "exact", head: true }).eq("memorial_public", true),
        supabase.from("memory_collections").select("id", { count: "exact", head: true }),
        supabase.from("consent_records").select("id", { count: "exact", head: true }),
        supabase.from("media_assets").select("file_size"),
      ]);

      const storageBytes = (storageResult.data || []).reduce((total, item) => {
        return total + (Number(item.file_size) || 0);
      }, 0);

      setStats({
        profiles: profilesResult.count || 0,
        memories: memoriesResult.count || 0,
        publicPages: publicResult.count || 0,
        albums: albumsResult.count || 0,
        consent: consentResult.count || 0,
        storageBytes,
      });

      setLoadingStats(false);
    }

    loadStats();
  }, []);

  const statCards = [
    {
      label: language === "es" ? "Perfiles" : "Profiles",
      value: stats.profiles,
      title: t.profiles,
      text: t.profileText,
    },
    {
      label: language === "es" ? "Recuerdos" : "Memories",
      value: stats.memories,
      title: t.memories,
      text: t.memoryText,
    },
    {
      label: language === "es" ? "Álbumes" : "Albums",
      value: stats.albums,
      title: t.albums,
      text: t.albumsText,
    },
    {
      label: language === "es" ? "Consent." : "Consent",
      value: stats.consent,
      title: t.consent,
      text: t.consentText,
    },
  ];

  const checklist = [
    { label: t.checklist[0], done: stats.consent > 0 },
    { label: t.checklist[1], done: stats.profiles > 0 },
    { label: t.checklist[2], done: stats.memories > 0 },
    { label: t.checklist[3], done: stats.publicPages > 0 },
    { label: t.checklist[4], done: false },
    { label: t.checklist[5], done: false },
  ];

  return (
    <main className="standaloneMobileApp">
      <header className="standaloneMobileTop">
        <div className="standaloneMobileBrand">
          <img src="/brand/logo-emblem.png" alt="VozEterna" />
          <span>VozEterna</span>
        </div>

        <button type="button" className="standaloneMobileMenu" aria-label="Menu">
          ☰
        </button>
      </header>

      <section className="standaloneMobileGrid">
        <div className="standaloneMobileMain">
          <Link href="/" className="standaloneBackLink">
            {t.back} <strong>MVP</strong>
          </Link>

          <p className="standaloneEyebrow">{t.familyLegacy}</p>
          <h1>{t.title}</h1>
          <p className="standaloneSubtitle">{t.subtitle}</p>

          <div className="standaloneHeroActions">
            <Link href={user ? "/app/loved-ones/new" : "/app/login"}>
              {t.createProfile}
            </Link>
            <Link href={user ? "/app/record" : "/app/login"}>
              {t.recordMemory}
            </Link>
          </div>

          <div className="standaloneStatsGrid">
            {statCards.map((card) => (
              <article key={card.label}>
                <p>{card.label}</p>
                <strong>{loadingStats ? "—" : card.value}</strong>
                <h2>{card.title}</h2>
                <span>{card.text}</span>
              </article>
            ))}
          </div>
        </div>

        <aside className="standaloneMobileSide">
          <div className="standaloneLang">
            <span className={language === "en" ? "active" : ""}>EN</span>
            <span className={language === "es" ? "active" : ""}>ES</span>
          </div>

          <div className="standaloneShield">
            <span>🛡</span>
            <div>
              <strong>{t.protectedVault}</strong>
              <p>{t.privateDefault}</p>
            </div>
          </div>

          <div className="standaloneStorage">
            <div
              className="standaloneStorageRing"
              style={{ "--mobile-storage": `${storagePercent}%` }}
            >
              <span>{storagePercent}%</span>
            </div>

            <div>
              <p>{t.storageUsed}</p>
              <strong>{storageDisplay}</strong>
              <small>{t.storageLimit}</small>
            </div>
          </div>

          <p className="standaloneEyebrow">{t.vaultProgress}</p>

          <div className="standaloneChecklist">
            {checklist.map((item) => (
              <div key={item.label} className={item.done ? "done" : ""}>
                <span>{item.done ? "✓" : "○"}</span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <nav className="standaloneBottomNav" aria-label="Mobile navigation">
        <Link href="/mobile">Dashboard</Link>
        <Link href="/app/loved-ones">Profile</Link>
        <Link href="/app/library">Library</Link>
        <Link href="/app/collections">Collections</Link>
        <Link href="/app/record">Record</Link>
      </nav>
    </main>
  );
}