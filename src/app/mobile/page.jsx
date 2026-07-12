"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import {
  getInitialMobileLanguage,
  setStoredMobileLanguage,
} from "../../components/mobile/mobileLanguage";

const copy = {
  en: {
    back: "Back to VozEterna App",
    mvp: "MVP",
    label: "Family Legacy",
    title: "Family Legacy Vault",
    subtitle: "Preserve voice memories, video messages, photos, prayers, stories, and family-approved memorial moments in one private legacy vault.",
    create: "Create profile",
    record: "Record memory",
    profiles: "Profiles",
    lovedOnes: "Loved Ones",
    profilesText: "Manage profiles for family and close friends.",
    memories: "Memories",
    savedItems: "Saved Items",
    memoriesText: "Photos, audio, video, notes, and keepsakes saved.",
    albums: "Albums",
    albumsTitle: "Albums",
    albumsText: "Curated memory collections.",
    consent: "Consent",
    consentTitle: "Consent",
    consentText: "Signed consent records.",
    protectedVault: "Protected Vault",
    privateDefault: "Private by default",
    storageUsed: "Storage used",
    storageLimit: "of 50 MB",
    vaultProgress: "Vault Progress",
    checklistConsent: "Consent signed",
    checklistProfiles: "Loved One profiles",
    checklistMemory: "Add first memory",
    checklistPublic: "Enable public page",
    checklistReview: "Review recordings",
    checklistApprove: "Approve for public page",
    promptLabel: "Memory Starter",
    promptTitle: "Today’s prompt",
    promptCta: "Record this memory",
    featuresStart: "Start here",
    featuresConsent: "Consent & Agreements",
    featuresConsentText: "Manage family consents and permissions.",
    featuresProfiles: "Profiles",
    featuresProfilesTitle: "Loved One Profiles",
    featuresProfilesText: "Care pages for the people who matter.",
    storageTipGood: "Plenty of space available.",
    storageTipMid: "Storage is growing. Consider uploading shorter clips.",
    storageTipHigh: "Storage is almost full. Compress videos or remove duplicates.",
    prompts: [
      "Tell a favorite childhood memory.",
      "Share a family recipe and who taught it to you.",
      "Describe a tradition you want your family to remember.",
      "Record a blessing for someone you love.",
    ],
  },
  es: {
    back: "Volver a VozEterna App",
    mvp: "MVP",
    label: "Legado Familiar",
    title: "Bóveda de Legado Familiar",
    subtitle: "Preserva recuerdos de voz, videos, fotos, oraciones, historias y momentos familiares aprobados en una bóveda privada.",
    create: "Crear perfil",
    record: "Grabar recuerdo",
    profiles: "Perfiles",
    lovedOnes: "Seres queridos",
    profilesText: "Administra perfiles de familia y personas cercanas.",
    memories: "Recuerdos",
    savedItems: "Guardados",
    memoriesText: "Fotos, audio, video, notas y recuerdos guardados.",
    albums: "Álbumes",
    albumsTitle: "Álbumes",
    albumsText: "Colecciones familiares organizadas.",
    consent: "Consentimiento",
    consentTitle: "Consentimiento",
    consentText: "Registros firmados guardados.",
    protectedVault: "Bóveda protegida",
    privateDefault: "Privada por defecto",
    storageUsed: "Almacenamiento usado",
    storageLimit: "de 50 MB",
    vaultProgress: "Progreso de la bóveda",
    checklistConsent: "Consentimiento firmado",
    checklistProfiles: "Perfiles creados",
    checklistMemory: "Agregar primer recuerdo",
    checklistPublic: "Activar página pública",
    checklistReview: "Revisar grabaciones",
    checklistApprove: "Aprobar para página pública",
    promptLabel: "Idea para recordar",
    promptTitle: "Pregunta de hoy",
    promptCta: "Grabar este recuerdo",
    featuresStart: "Empieza aquí",
    featuresConsent: "Consentimiento",
    featuresConsentText: "Administra permisos y autorizaciones familiares.",
    featuresProfiles: "Perfiles",
    featuresProfilesTitle: "Perfiles de seres queridos",
    featuresProfilesText: "Páginas privadas para las personas importantes.",
    storageTipGood: "Todavía tienes buen espacio disponible.",
    storageTipMid: "El almacenamiento está creciendo. Considera subir videos más cortos.",
    storageTipHigh: "El almacenamiento casi está lleno. Comprime videos o elimina duplicados.",
    prompts: [
      "Cuenta un recuerdo favorito de tu infancia.",
      "Comparte una receta familiar y quién te la enseñó.",
      "Describe una tradición que quieres que tu familia recuerde.",
      "Graba una bendición para alguien que amas.",
    ],
  },
};

function formatStorage(bytes) {
  const safeBytes = Number(bytes) || 0;
  if (safeBytes <= 0) return "0 KB";
  if (safeBytes < 1024 * 1024) return `${(safeBytes / 1024).toFixed(1)} KB`;
  return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MobileDashboardPage() {
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

  const dailyPrompt = useMemo(() => {
    const dayNumber = Math.floor(Date.now() / 86400000);
    return t.prompts[dayNumber % t.prompts.length];
  }, [t.prompts]);

  const storageLimitBytes = 50 * 1024 * 1024;
  const storageBytes = Number(stats.storageBytes) || 0;
  const storagePercent = Math.min(100, Math.max(0, Math.round((storageBytes / storageLimitBytes) * 100)));
  const storageDisplay = loadingStats ? "—" : formatStorage(storageBytes);
  const storageTip =
    storagePercent >= 80
      ? t.storageTipHigh
      : storagePercent >= 50
        ? t.storageTipMid
        : t.storageTipGood;

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
        albumsResult,
        consentResult,
        storageResult,
      ] = await Promise.all([
        supabase.from("vaults").select("id", { count: "exact", head: true }),
        supabase.from("memories").select("id", { count: "exact", head: true }),
        supabase.from("memory_collections").select("id", { count: "exact", head: true }),
        supabase.from("consent_records").select("id", { count: "exact", head: true }),
        supabase.from("memories").select("media_size_bytes"),
      ]);

      const storageBytes = (storageResult.data || []).reduce((total, item) => {
        return total + (Number(item.media_size_bytes) || 0);
      }, 0);

      setStats({
        profiles: profilesResult.count || 0,
        memories: memoriesResult.count || 0,
        publicPages: 0,
        albums: albumsResult.count || 0,
        consent: consentResult.count || 0,
        storageBytes,
      });

      setLoadingStats(false);
    }

    loadStats();
  }, []);

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setStoredMobileLanguage(nextLanguage);
  }

  const statCards = [
    { href: "/mobile/profiles", label: t.profiles, value: stats.profiles, title: t.lovedOnes, text: t.profilesText },
    { href: "/mobile/library", label: t.memories, value: stats.memories, title: t.savedItems, text: t.memoriesText },
    { href: "/mobile/collections", label: t.albums, value: stats.albums, title: t.albumsTitle, text: t.albumsText },
    { href: "/mobile/consent", label: t.consent, value: stats.consent, title: t.consentTitle, text: t.consentText },
  ];

  const checklist = [
    { label: t.checklistConsent, done: stats.consent > 0 },
    { label: t.checklistProfiles, done: stats.profiles > 0 },
    { label: t.checklistMemory, done: stats.memories > 0 },
    { label: t.checklistPublic, done: stats.publicPages > 0 },
    { label: t.checklistReview, done: false },
    { label: t.checklistApprove, done: false },
  ];

  return (
    <>
      <section className="mobileDashboardHeroGrid">
        <div className="mobileHeroMainCard">
          <Link href="/" className="mobileBackLink">
            {t.back} <strong>{t.mvp}</strong>
          </Link>

          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.title}</h1>
          <p className="mobileHeroText">{t.subtitle}</p>

          <div className="mobileHeroActions">
            <Link href={user ? "/mobile/profiles/new" : "/mobile/account"}>{t.create}</Link>
            <Link href={user ? "/mobile/record" : "/mobile/account"}>{t.record}</Link>
          </div>

          <div className="mobileStatGrid">
            {statCards.map((card) => (
              <Link href={card.href} className="mobileStatCardLink" key={card.label}>
                <p>{card.label}</p>
                <strong>{loadingStats ? "—" : card.value}</strong>
                <h2>{card.title}</h2>
                <span>{card.text}</span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="mobileHeroStatusCard">
          <div className="mobileLangPill">
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              onClick={() => changeLanguage("en")}
            >
              EN
            </button>

            <button
              type="button"
              className={language === "es" ? "active" : ""}
              onClick={() => changeLanguage("es")}
            >
              ES
            </button>
          </div>

          <div className="mobileProtectedCard">
            <span>🛡</span>
            <div>
              <strong>{t.protectedVault}</strong>
              <p>{t.privateDefault}</p>
            </div>
          </div>

          <div className="mobileStorageCard">
            <div className="mobileStorageRing" style={{ "--mobile-storage": `${storagePercent}%` }}>
              <span>{storagePercent}%</span>
            </div>

            <div>
              <p>{t.storageUsed}</p>
              <strong>{storageDisplay}</strong>
              <small>{t.storageLimit}</small>
            </div>
          </div>

          <p className="mobileStorageTip">{storageTip}</p>

          <p className="mobileCapsLabel">{t.vaultProgress}</p>
          <h2>{t.vaultProgress}</h2>

          <div className="mobileProgressChecklist">
            {checklist.map((item) => (
              <div key={item.label} className={item.done ? "done" : ""}>
                <span>{item.done ? "✓" : "○"}</span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mobilePromptCard">
        <p className="mobileCapsLabel">{t.promptLabel}</p>
        <h2>{t.promptTitle}</h2>
        <p>{dailyPrompt}</p>
        <Link href={user ? "/mobile/record" : "/mobile/account"}>{t.promptCta}</Link>
      </section>

      <section className="mobileFeatureGrid">
        <Link href="/mobile/consent">
          <p>{t.featuresStart}</p>
          <h2>{t.featuresConsent}</h2>
          <span>{t.featuresConsentText}</span>
        </Link>

        <Link href="/mobile/profiles">
          <p>{t.featuresProfiles}</p>
          <h2>{t.featuresProfilesTitle}</h2>
          <span>{t.featuresProfilesText}</span>
        </Link>
      </section>
    </>
  );
}