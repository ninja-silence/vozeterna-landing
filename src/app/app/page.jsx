"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLanguageToggle from "../../components/app/AppLanguageToggle";
import { supabase } from "../../lib/supabaseClient";

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
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const t = copy[language];

  useEffect(() => {
    async function loadDashboardStats() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoadingStats(false);
        return;
      }

      const [profilesResult, memoriesResult, publicMemorialsResult, consentResult] =
        await Promise.all([
          supabase.from("loved_ones").select("id", { count: "exact", head: true }),
          supabase.from("media_assets").select("id", { count: "exact", head: true }),
          supabase
            .from("loved_ones")
            .select("id", { count: "exact", head: true })
            .eq("memorial_public", true),
          supabase.from("consent_records").select("id", { count: "exact", head: true }),
        ]);

      setStats({
        profiles: profilesResult.count || 0,
        memories: memoriesResult.count || 0,
        publicMemorials: publicMemorialsResult.count || 0,
        consentRecords: consentResult.count || 0,
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
        </div>

        <div className="dashboardStatusCard">
          <AppLanguageToggle language={language} setLanguage={setLanguage} />

          <div className="statusOrb">
            <span>{user ? "VE" : "?"}</span>
          </div>

          <p className="appEyebrow">{t.vaultStatus}</p>
          <h2>{user ? t.statusSignedIn : t.statusSignedOut}</h2>
          <p>{user ? t.statusTextSignedIn : t.statusTextSignedOut}</p>

          {!user && (
            <Link href="/app/login" className="appButton">
              {t.signIn}
            </Link>
          )}
        </div>
      </section>

      <section className="dashboardStatsGrid liveStatsGrid">
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