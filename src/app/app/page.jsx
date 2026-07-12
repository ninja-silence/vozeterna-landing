"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AppLanguageToggle from "../../components/app/AppLanguageToggle";
import { supabase } from "../../lib/supabaseClient";
import { getStoredAppLanguage } from "../../lib/appLanguage";

const copy = {
  en: {
    back: "Back to website",
    eyebrow: "VozEterna App MVP",
    title: "Family Legacy Vault",
    subtitle:
      "Preserve voice memories, video messages, photos, prayers, stories, and family-approved memorial moments in one private legacy vault.",
    createProfile: "Create profile",
    recordMemory: "Record memory",
    viewLibrary: "View library",
    vaultStatus: "Vault Status",
    progressTitle: "Vault Progress",
    progressText: "A quick look at what is already set up and what to do next.",
    consentDone: "Consent signed",
    consentTodo: "Sign consent",
    profilesDone: "Profiles created",
    profilesTodo: "Create first profile",
    memoriesDone: "Memories saved",
    memoriesTodo: "Add first memory",
    publicDone: "Public page enabled",
    publicTodo: "Enable a public page",
    voiceTodo: "Add a voice or video memory",
    publicMemoryTodo: "Choose memories for public page",
    statusSignedIn: "Your legacy system is taking shape",
    statusSignedOut: "Sign in to begin",
    statusTextSignedIn:
      "Private vault, consent records, public memorial pages, QR sharing, and selected public memories are now connected.",
    statusTextSignedOut:
      "Create profiles, record memories, upload keepsakes, and prepare family-approved memorial pages.",
    signIn: "Sign in",
    stats: {
      profilesLabel: "Profiles",
      profilesTitle: "Loved Ones",
      profilesText: "Legacy profiles created in your private vault.",
      memoriesLabel: "Memories",
      memoriesTitle: "Saved Items",
      memoriesText: "Photos, audio, video, notes, and keepsakes saved.",
      albumsLabel: "Albums",
      albumsTitle: "Memory Albums",
      albumsText: "Curated collections that organize family memories.",
      publicLabel: "Public",
      publicTitle: "Memorial Pages",
      publicText: "Public memorial profiles enabled for sharing.",
      consentLabel: "Consent",
      consentTitle: "Signed Records",
      consentText: "Consent records stored with legal name and signature.",
    },
    cards: [
      {
        tag: "Start here",
        title: "Consent & Agreements",
        text: "Review the agreement before recording or enabling future AI voice features.",
        href: "/app/consent",
      },
      {
        tag: "Profiles",
        title: "Loved One Profiles",
        text: "Create legacy profiles with photos, bios, relationships, and memorial settings.",
        href: "/app/loved-ones",
        featured: true,
      },
      {
        tag: "Capture",
        title: "Record Voice & Video",
        text: "Use your microphone or camera to preserve meaningful family memories.",
        href: "/app/record",
      },
      {
        tag: "Upload",
        title: "Upload Memories",
        text: "Add photos, audio, video, keepsakes, and notes to the private vault.",
        href: "/app/upload",
      },
      {
        tag: "Trust",
        title: "Consent History",
        text: "Review signed consent records and captured signatures from your account.",
        href: "/app/consent-history",
      },
      {
        tag: "Library",
        title: "Memory Library",
        text: "View, share, delete, and control which memories appear on memorial pages.",
        href: "/app/library",
      },
      {
        tag: "Albums",
        title: "Memory Albums",
        text: "Organize photos, voices, videos, and stories into curated family collections.",
        href: "/app/collections",
      },
    ],
  },
  es: {
    back: "Volver al sitio web",
    eyebrow: "MVP de VozEterna",
    title: "Bóveda de Legado Familiar",
    subtitle:
      "Preserva recuerdos de voz, mensajes en video, fotos, oraciones, historias y momentos conmemorativos aprobados por la familia en una bóveda privada.",
    createProfile: "Crear perfil",
    recordMemory: "Grabar recuerdo",
    viewLibrary: "Ver biblioteca",
    vaultStatus: "Estado de la bóveda",
    progressTitle: "Progreso de la bóveda",
    progressText: "Un vistazo rápido a lo que ya está configurado y lo que sigue.",
    consentDone: "Consentimiento firmado",
    consentTodo: "Firmar consentimiento",
    profilesDone: "Perfiles creados",
    profilesTodo: "Crear primer perfil",
    memoriesDone: "Recuerdos guardados",
    memoriesTodo: "Agregar primer recuerdo",
    publicDone: "Página pública activada",
    publicTodo: "Activar una página pública",
    voiceTodo: "Agregar recuerdo de voz o video",
    publicMemoryTodo: "Elegir recuerdos para la página pública",
    statusSignedIn: "Tu sistema de legado está tomando forma",
    statusSignedOut: "Inicia sesión para comenzar",
    statusTextSignedIn:
      "La bóveda privada, los consentimientos, las páginas conmemorativas, los QR y los recuerdos públicos seleccionados ya están conectados.",
    statusTextSignedOut:
      "Crea perfiles, graba recuerdos, sube recuerdos familiares y prepara páginas conmemorativas aprobadas por la familia.",
    signIn: "Iniciar sesión",
    stats: {
      profilesLabel: "Perfiles",
      profilesTitle: "Seres queridos",
      profilesText: "Perfiles de legado creados en tu bóveda privada.",
      memoriesLabel: "Recuerdos",
      memoriesTitle: "Elementos guardados",
      memoriesText: "Fotos, audio, video, notas y recuerdos especiales guardados.",
      albumsLabel: "Álbumes",
      albumsTitle: "Álbumes de recuerdos",
      albumsText: "Colecciones organizadas para recuerdos familiares.",
      publicLabel: "Público",
      publicTitle: "Páginas memoriales",
      publicText: "Perfiles conmemorativos públicos habilitados para compartir.",
      consentLabel: "Consentimiento",
      consentTitle: "Registros firmados",
      consentText: "Consentimientos guardados con nombre legal y firma.",
    },
    cards: [
      {
        tag: "Comienza aquí",
        title: "Consentimiento y acuerdos",
        text: "Revisa el acuerdo antes de grabar o activar futuras funciones de voz con IA.",
        href: "/app/consent",
      },
      {
        tag: "Perfiles",
        title: "Perfiles de seres queridos",
        text: "Crea perfiles de legado con fotos, biografías, parentesco y ajustes memoriales.",
        href: "/app/loved-ones",
        featured: true,
      },
      {
        tag: "Capturar",
        title: "Grabar voz y video",
        text: "Usa tu micrófono o cámara para preservar recuerdos familiares importantes.",
        href: "/app/record",
      },
      {
        tag: "Subir",
        title: "Subir recuerdos",
        text: "Agrega fotos, audio, video, recuerdos especiales y notas a la bóveda privada.",
        href: "/app/upload",
      },
      {
        tag: "Confianza",
        title: "Historial de consentimiento",
        text: "Revisa consentimientos firmados y firmas capturadas desde tu cuenta.",
        href: "/app/consent-history",
      },
      {
        tag: "Biblioteca",
        title: "Biblioteca de recuerdos",
        text: "Ve, comparte, elimina y controla qué recuerdos aparecen en páginas memoriales.",
        href: "/app/library",
      },
      {
        tag: "Álbumes",
        title: "Álbumes de recuerdos",
        text: "Organiza fotos, voces, videos e historias en colecciones familiares curadas.",
        href: "/app/collections",
      },
    ],
  },
};

export default function AppHomePage() {
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    profiles: 0,
    memories: 0,
    publicMemorials: 0,
    consentRecords: 0,
    albums: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const t = copy[language];

  function formatStorage(bytes) {
    const safeBytes = Number(bytes) || 0;

    if (safeBytes <= 0) {
      return "0 KB";
    }

    if (safeBytes < 1024 * 1024) {
      return `${(safeBytes / 1024).toFixed(1)} KB`;
    }

    return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

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
    async function loadDashboardStats() {
      setLoadingStats(true);

      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setStats({
          profiles: 0,
          memories: 0,
          publicMemorials: 0,
          consentRecords: 0,
          albums: 0,
          storageBytes: 0,
        });
        setLoadingStats(false);
        return;
      }

      const [
        profilesResult,
        memoriesResult,
        publicMemorialsResult,
        consentResult,
        albumsResult,
        storageResult,
      ] = await Promise.all([
        supabase.from("loved_ones").select("id", { count: "exact", head: true }),
        supabase.from("media_assets").select("id", { count: "exact", head: true }),
        supabase
          .from("loved_ones")
          .select("id", { count: "exact", head: true })
          .eq("memorial_public", true),
        supabase.from("consent_records").select("id", { count: "exact", head: true }),
        supabase.from("memory_collections").select("id", { count: "exact", head: true }),
        supabase.from("media_assets").select("file_size"),
      ]);

      const storageBytes = (storageResult.data || []).reduce((total, item) => {
        return total + (Number(item.file_size) || 0);
      }, 0);

      setStats({
        profiles: profilesResult.count || 0,
        memories: memoriesResult.count || 0,
        publicMemorials: publicMemorialsResult.count || 0,
        consentRecords: consentResult.count || 0,
        albums: albumsResult.count || 0,
        storageBytes,
      });

      setLoadingStats(false);
    }

    loadDashboardStats();
  }, []);

  const statLabel = loadingStats ? "—" : "";

  return (
    <main className="appShell appDashboardShell">
      <div className="dashboardGlow glowOne" />
      <div className="dashboardGlow glowTwo" />

      <section className="dashboardHero">
        <div className="dashboardHeroText">
          <Link href="/" className="textLink">
            {t.back}
          </Link>

          <p className="appEyebrow">{t.eyebrow}</p>

          <h1>{t.title}</h1>

          <p>{t.subtitle}</p>

          <div className="dashboardHeroActions">
            <Link href="/app/loved-ones/new" className="appButton">
              {t.createProfile}
            </Link>

            <Link href="/app/record" className="appButton secondary">
              {t.recordMemory}
            </Link>

            <Link href="/app/library" className="appButton ghost">
              {t.viewLibrary}
            </Link>
          </div>
<section className="dashboardStatsGrid liveStatsGrid dashboardHeroStats">
        <article>
          <span>{t.stats.profilesLabel}</span>
          <strong>{loadingStats ? statLabel : stats.profiles}</strong>
          <h2>{t.stats.profilesTitle}</h2>
          <p>{t.stats.profilesText}</p>
        </article>

        <article>
          <span>{t.stats.memoriesLabel}</span>
          <strong>{loadingStats ? statLabel : stats.memories}</strong>
          <h2>{t.stats.memoriesTitle}</h2>
          <p>{t.stats.memoriesText}</p>
        </article>

        <article>
          <span>{t.stats.albumsLabel}</span>
          <strong>{loadingStats ? statLabel : stats.albums}</strong>
          <h2>{t.stats.albumsTitle}</h2>
          <p>{t.stats.albumsText}</p>
        </article>

        <article>
          <span>{t.stats.publicLabel}</span>
          <strong>{loadingStats ? statLabel : stats.publicMemorials}</strong>
          <h2>{t.stats.publicTitle}</h2>
          <p>{t.stats.publicText}</p>
        </article>

        <article>
          <span>{t.stats.consentLabel}</span>
          <strong>{loadingStats ? statLabel : stats.consentRecords}</strong>
          <h2>{t.stats.consentTitle}</h2>
          <p>{t.stats.consentText}</p>
        </article>
      </section>
        </div>

        <div className="dashboardStatusCard">
          <AppLanguageToggle language={language} setLanguage={setLanguage} />

                    <div className="statusShield" aria-label={language === "es" ? "Bóveda protegida" : "Protected Vault"}>
            <div className="statusShieldIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="statusShieldSvg" aria-hidden="true">
                <defs>
                  <linearGradient id="metalShieldGradient" x1="5" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="18%" stopColor="#dfe8eb" />
                    <stop offset="42%" stopColor="#0e5b73" />
                    <stop offset="70%" stopColor="#083f52" />
                    <stop offset="100%" stopColor="#c8943c" />
                  </linearGradient>
                  <radialGradient id="metalShieldHighlight" cx="35%" cy="18%" r="55%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="38%" stopColor="#ffffff" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <path className="statusShieldMetal" d="M12 2 4 5.5V11c0 5.2 3.4 9.9 8 11 4.6-1.1 8-5.8 8-11V5.5L12 2Z" />
                <path className="statusShieldShine" d="M12 2 4 5.5V11c0 5.2 3.4 9.9 8 11 4.6-1.1 8-5.8 8-11V5.5L12 2Z" />
                <path className="statusShieldCheck" d="M9.5 12.2l1.8 1.8 3.7-4.2" />
              </svg>
            </div>
            <div className="statusShieldText">
              <strong>{language === "es" ? "Bóveda protegida" : "Protected Vault"}</strong>
              <span>{language === "es" ? "Privada por defecto" : "Private by default"}</span>
            </div>
          </div>

          <div className="storageMeterCard">
            <div
              className="storageRing"
              style={{ "--storage-percent": `${storagePercent}%` }}
              aria-label={`${t.storageLabel}: ${storageDisplay} ${t.storageLimitLabel}`}
            >
              <div className="storageRingInner">
                <strong>{storagePercent}%</strong>
              </div>
            </div>

            <div className="storageMeterText">
              <span>{t.storageLabel}</span>
              <strong>{storageDisplay}</strong>
              <p>{t.storageLimitLabel}</p>
            </div>
          </div>

          <p className="appEyebrow">{t.vaultStatus}</p>
          <h2>{user ? t.progressTitle : t.statusSignedOut}</h2>
          <p>{user ? t.progressText : t.statusTextSignedOut}</p>

          {user ? (
            <div className="vaultProgressList">
              <div className={stats.consentRecords > 0 ? "vaultProgressItem done" : "vaultProgressItem"}>
                <span>{stats.consentRecords > 0 ? "✓" : "○"}</span>
                <p>{stats.consentRecords > 0 ? t.consentDone : t.consentTodo}</p>
              </div>

              <div className={stats.profiles > 0 ? "vaultProgressItem done" : "vaultProgressItem"}>
                <span>{stats.profiles > 0 ? "✓" : "○"}</span>
                <p>{stats.profiles > 0 ? t.profilesDone : t.profilesTodo}</p>
              </div>

              <div className={stats.memories > 0 ? "vaultProgressItem done" : "vaultProgressItem"}>
                <span>{stats.memories > 0 ? "✓" : "○"}</span>
                <p>{stats.memories > 0 ? t.memoriesDone : t.memoriesTodo}</p>
              </div>

              <div className={stats.publicMemorials > 0 ? "vaultProgressItem done" : "vaultProgressItem"}>
                <span>{stats.publicMemorials > 0 ? "✓" : "○"}</span>
                <p>{stats.publicMemorials > 0 ? t.publicDone : t.publicTodo}</p>
              </div>

              <div className="vaultProgressItem next">
                <span>→</span>
                <p>{t.voiceTodo}</p>
              </div>

              <div className="vaultProgressItem next">
                <span>→</span>
                <p>{t.publicMemoryTodo}</p>
              </div>
            </div>
          ) : (
            <Link href="/app/login" className="appButton">
              {t.signIn}
            </Link>
          )}
        </div>
      </section>

      <section className="dashboardActionGrid">
        {t.cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={card.featured ? "dashboardActionCard featured" : "dashboardActionCard"}
          >
            <span>{card.tag}</span>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}