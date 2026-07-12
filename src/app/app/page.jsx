"use client";

import Link from "next/link";
import MobileDashboard from "../../components/app/dashboard/MobileDashboard";
import { useEffect, useMemo, useState } from "react";
import AppLanguageToggle from "../../components/app/AppLanguageToggle";
import { getStoredAppLanguage } from "../../lib/appLanguage";
import { supabase } from "../../lib/supabaseClient";

const copy = {
  en: {
    welcome: "Welcome to your",
    title: "Family Legacy Dashboard",
    description:
      "Preserve and share legacy memories. Manage your vault status, privacy, and family-ready next steps from one calm dashboard.",
    primaryAction: "Add next memory",
    secondaryAction: "View library",
    signIn: "Sign in",
    progressOverview: "Progress overview",
    quickStats: "Quick stats",
    vaultProgress: "Vault Progress",
    vaultStatus: "Vault Status",
    protectedVault: "Protected Vault",
    privateDefault: "Private by default",
    setupStatus: "Setup status",
    storageUsed: "Storage used",
    storageLimit: "of 50 MB",
    complete: "Complete",
    recommendedTitle: "Recommended next steps",
    recommendedText:
      "Focus on the actions that move the vault forward instead of repeating every menu item.",
    upToDate: "Good",
    upToDateTitle: "Up-to-date",
    upToDateText: "Your vault is secure and ready for the next family memory.",
    needsAttention: "Needs attention",
    needsAttentionTitle: "Next step ready",
    needsAttentionText: "Your vault is active. Finish the remaining setup items to prepare it for family use.",
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
      privacyLabel: "Privacy",
      privacyTitle: "Protected",
      privacyText: "Private by default with family-controlled sharing.",
      privacyValue: "Active",
    },
    checklist: {
      consentDone: "Consent signed",
      consentTodo: "Sign consent agreement",
      profilesDone: "Profile created",
      profilesTodo: "Create first profile",
      vaultDone: "Vault secured",
      vaultTodo: "Secure your vault",
      publicDone: "Public page available",
      publicTodo: "Prepare public page",
      memoryDone: "One approved memory",
      memoryTodo: "Add first memory",
    },
    nextSteps: [
      {
        tag: "Next best action",
        title: "Add a memory",
        text: "Preserve a voice note, video, photo, prayer, or written family story.",
        href: "/app/record",
        button: "Record memory",
      },
      {
        tag: "Family legacy",
        title: "Review public page",
        text: "Choose what is private and what can appear on a family-approved memorial page.",
        href: "/app/library",
        button: "Review memories",
      },
      {
        tag: "Trust",
        title: "Confirm consent",
        text: "Keep voice, AI, and memorial features grounded in clear authorization.",
        href: "/app/consent",
        button: "Review consent",
      },
    ],
  },
  es: {
    welcome: "Bienvenido a tu",
    title: "Panel de Legado Familiar",
    description:
      "Preserva y comparte recuerdos de legado. Administra el estado, privacidad y próximos pasos familiares desde un panel tranquilo.",
    primaryAction: "Agregar recuerdo",
    secondaryAction: "Ver biblioteca",
    signIn: "Iniciar sesión",
    progressOverview: "Resumen de progreso",
    quickStats: "Estadísticas rápidas",
    vaultProgress: "Progreso de la bóveda",
    vaultStatus: "Estado de la bóveda",
    protectedVault: "Bóveda protegida",
    privateDefault: "Privada por defecto",
    setupStatus: "Estado de configuración",
    storageUsed: "Almacenamiento usado",
    storageLimit: "de 50 MB",
    complete: "Completo",
    recommendedTitle: "Siguientes pasos recomendados",
    recommendedText:
      "Enfócate en las acciones que hacen avanzar la bóveda sin repetir todo el menú.",
    upToDate: "Bien",
    upToDateTitle: "Al día",
    upToDateText: "Tu bóveda está segura y lista para el siguiente recuerdo familiar.",
    needsAttention: "Pendiente",
    needsAttentionTitle: "Siguiente paso listo",
    needsAttentionText: "Tu bóveda está activa. Completa los pasos restantes para prepararla para la familia.",
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
      privacyLabel: "Privacidad",
      privacyTitle: "Protegida",
      privacyText: "Privada por defecto con control familiar.",
      privacyValue: "Activa",
    },
    checklist: {
      consentDone: "Consentimiento firmado",
      consentTodo: "Firmar consentimiento",
      profilesDone: "Perfil creado",
      profilesTodo: "Crear primer perfil",
      vaultDone: "Bóveda protegida",
      vaultTodo: "Proteger tu bóveda",
      publicDone: "Página pública disponible",
      publicTodo: "Preparar página pública",
      memoryDone: "Un recuerdo aprobado",
      memoryTodo: "Agregar primer recuerdo",
    },
    nextSteps: [
      {
        tag: "Mejor siguiente acción",
        title: "Agrega un recuerdo",
        text: "Preserva una nota de voz, video, foto, oración o historia familiar escrita.",
        href: "/app/record",
        button: "Grabar recuerdo",
      },
      {
        tag: "Legado familiar",
        title: "Revisa la página pública",
        text: "Elige qué será privado y qué puede aparecer en una página memorial aprobada.",
        href: "/app/library",
        button: "Revisar recuerdos",
      },
      {
        tag: "Confianza",
        title: "Confirma consentimiento",
        text: "Mantén voz, IA y memoriales respaldados por autorización clara.",
        href: "/app/consent",
        button: "Revisar consentimiento",
      },
    ],
  },
};

function formatStorage(bytes) {
  const safeBytes = Number(bytes) || 0;

  if (safeBytes <= 0) return "0 KB";
  if (safeBytes < 1024 * 1024) return `${(safeBytes / 1024).toFixed(1)} KB`;
  return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AppHomePage() {
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    profiles: 0,
    memories: 0,
    publicMemorials: 0,
    consentRecords: 0,
    albums: 0,
    storageBytes: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [isMobileDashboard, setIsMobileDashboard] = useState(false);

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

      const totalStorageBytes = (storageResult.data || []).reduce((total, item) => {
        return total + (Number(item.file_size) || 0);
      }, 0);

      setStats({
        profiles: profilesResult.count || 0,
        memories: memoriesResult.count || 0,
        publicMemorials: publicMemorialsResult.count || 0,
        consentRecords: consentResult.count || 0,
        albums: albumsResult.count || 0,
        storageBytes: totalStorageBytes,
      });

      setLoadingStats(false);
    }

    loadDashboardStats();
  }, []);

  const checklistItems = useMemo(
    () => [
      {
        complete: stats.consentRecords > 0,
        label: stats.consentRecords > 0 ? t.checklist.consentDone : t.checklist.consentTodo,
      },
      {
        complete: stats.profiles > 0,
        label: stats.profiles > 0 ? t.checklist.profilesDone : t.checklist.profilesTodo,
      },
      {
        complete: true,
        label: t.checklist.vaultDone,
      },
      {
        complete: stats.publicMemorials > 0,
        label: stats.publicMemorials > 0 ? t.checklist.publicDone : t.checklist.publicTodo,
      },
      {
        complete: stats.memories > 0,
        label: stats.memories > 0 ? t.checklist.memoryDone : t.checklist.memoryTodo,
      },
    ],
    [stats, t]
  );

  const completedCount = checklistItems.filter((item) => item.complete).length;
  const totalCount = checklistItems.length;
  const setupPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isGood = completedCount >= 4;

  const primaryDashboardHref = !user
    ? "/app/login"
    : stats.profiles <= 0
      ? "/app/loved-ones/new"
      : stats.memories <= 0
        ? "/app/record"
        : stats.publicMemorials <= 0
          ? "/app/library"
          : "/app/record";

  const primaryDashboardLabel = !user
    ? t.signIn
    : stats.profiles <= 0
      ? language === "es" ? "Crear primer perfil" : "Create first profile"
      : stats.memories <= 0
        ? language === "es" ? "Agregar primer recuerdo" : "Add first memory"
        : stats.publicMemorials <= 0
          ? language === "es" ? "Revisar página pública" : "Review public page"
          : t.primaryAction;

  const metrics = [
    {
      label: t.stats.profilesLabel,
      value: loadingStats ? "—" : stats.profiles,
      title: t.stats.profilesTitle,
      text: t.stats.profilesText,
    },
    {
      label: t.stats.memoriesLabel,
      value: loadingStats ? "—" : stats.memories,
      title: t.stats.memoriesTitle,
      text: t.stats.memoriesText,
    },
    {
      label: t.stats.publicLabel,
      value: loadingStats ? "—" : stats.publicMemorials,
      title: t.stats.publicTitle,
      text: t.stats.publicText,
    },
    {
      label: t.stats.albumsLabel,
      value: loadingStats ? "—" : stats.albums,
      title: t.stats.albumsTitle,
      text: t.stats.albumsText,
    },
    {
      label: t.stats.consentLabel,
      value: loadingStats ? "—" : stats.consentRecords,
      title: t.stats.consentTitle,
      text: t.stats.consentText,
    },
    {
      label: t.stats.privacyLabel,
      value: loadingStats ? "—" : t.stats.privacyValue,
      title: t.stats.privacyTitle,
      text: t.stats.privacyText,
      className: "privacyMetricCard",
    },
  ];

  return (
    <>
      <div className="mobileDashboardRender">
        <MobileDashboard
          language={language}
          user={user}
          stats={stats}
          loadingStats={loadingStats}
          storageDisplay={storageDisplay}
          storagePercent={storagePercent}
        />
      </div>

      <div className="desktopDashboardRender">
        <main className="appShell appDashboardV3">
      <section className="dashboardWelcomeRow">
        <div>
          <p>{t.welcome}</p>
          <h1>{t.title}</h1>
          <span>{t.description}</span>

          <div className="dashboardHeroActions">
            <Link href={primaryDashboardHref} className="appButton">
              {primaryDashboardLabel}
            </Link>
            <Link href="/app/library" className="appButton secondary">
              {t.secondaryAction}
            </Link>
          </div>
        </div>

        <aside className={isGood ? "dashboardHealthCard good" : "dashboardHealthCard"}>
          <div>
            <span>{isGood ? "✓" : "!"}</span>
            <strong>{isGood ? t.upToDate : t.needsAttention}</strong>
          </div>
          <h2>{isGood ? t.upToDateTitle : t.needsAttentionTitle}</h2>
          <p>{isGood ? t.upToDateText : t.needsAttentionText}</p>
        </aside>
      </section>

      <section className="dashboardMainGrid">
        <div className="dashboardLeftStack">
          <section className="progressOverviewCard">
            <div className="dashboardSectionTitle">
              <h2>{t.progressOverview}</h2>
              <p>{completedCount}/{totalCount} {t.complete}</p>
            </div>

            <div className="progressOverviewBody">
              <div className="progressBarBlock">
                <div className="progressBarTrack">
                  <span style={{ width: `${setupPercent}%` }} />
                </div>

                <div className="progressHighlights">
                  <div>
                    <span>✓</span>
                    <strong>{stats.memories}</strong>
                    <p>{language === "es" ? "recuerdos agregados" : "memories added"}</p>
                  </div>

                  <div>
                    <span>◆</span>
                    <strong>{t.protectedVault}</strong>
                    <p>{storageDisplay} {language === "es" ? "usados" : "used"}</p>
                  </div>
                </div>
              </div>

              <div className="setupRing" style={{ "--setup-percent": `${setupPercent}%` }}>
                <div>
                  <strong>{setupPercent}%</strong>
                  <span>{t.complete}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="quickStatsCard">
            <div className="dashboardSectionTitle">
              <h2>{t.quickStats}</h2>
              <p>{language === "es" ? "Estado actual" : "Current status"}</p>
            </div>

            <div className="dashboardStatsGrid liveStatsGrid dashboardHeroStats">
              {metrics.map((metric, index) => (
                <article
                  key={metric.label}
                  className={metric.className || ""}
                  data-metric-index={index + 1}
                >
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <h2>{metric.title}</h2>
                  <p>{metric.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboardStatusCard dashboardStatusCardV3">
          <AppLanguageToggle language={language} setLanguage={setLanguage} />

          <div className="statusShield">
            <div className="statusShieldIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="statusShieldSvg" aria-hidden="true">
                <defs>
                  <linearGradient
                    id="metalShieldGradient"
                    x1="5"
                    y1="2"
                    x2="20"
                    y2="22"
                    gradientUnits="userSpaceOnUse"
                  >
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
                <path
                  className="statusShieldMetal"
                  d="M12 2 4 5.5V11c0 5.2 3.4 9.9 8 11 4.6-1.1 8-5.8 8-11V5.5L12 2Z"
                />
                <path
                  className="statusShieldShine"
                  d="M12 2 4 5.5V11c0 5.2 3.4 9.9 8 11 4.6-1.1 8-5.8 8-11V5.5L12 2Z"
                />
                <path className="statusShieldCheck" d="M9.5 12.2l1.8 1.8 3.7-4.2" />
              </svg>
            </div>
            <div className="statusShieldText">
              <strong>{t.protectedVault}</strong>
              <span>{t.privateDefault}</span>
            </div>
          </div>

          <p className="appEyebrow">{t.vaultProgress}</p>
          <h2>{t.vaultStatus}</h2>

          <div className="vaultProgressList">
            {checklistItems.map((item) => (
              <div
                key={item.label}
                className={item.complete ? "vaultProgressItem complete" : "vaultProgressItem"}
              >
                <span>{item.complete ? "✓" : "→"}</span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>

          <div className="sideStorageBlock">
            <div className="storageMeterCard">
              <div
                className="storageRing"
                style={{ "--storage-percent": `${storagePercent}%` }}
                aria-label={`${t.storageUsed}: ${storageDisplay} ${t.storageLimit}`}
              >
                <div className="storageRingInner">
                  <strong>{storagePercent}%</strong>
                </div>
              </div>

              <div className="storageMeterText">
                <span>{t.storageUsed}</span>
                <strong>{storageDisplay}</strong>
                <p>{t.storageLimit}</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="dashboardRecommendedSection">
        <div className="dashboardRecommendedHeader">
          <p className="appEyebrow">{language === "es" ? "Enfoque" : "Focus"}</p>
          <h2>{t.recommendedTitle}</h2>
          <p>{t.recommendedText}</p>
        </div>

        <div className="dashboardRecommendedGrid">
          {t.nextSteps.map((step, index) => (
            <Link href={user ? step.href : "/app/login"} className="recommendedStepCard" key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step.tag}</p>
              <h3>{step.title}</h3>
              <small>{step.text}</small>
              <strong>{user ? step.button : t.signIn}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
      </div>
    </>
  );
}