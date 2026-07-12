"use client";

import Link from "next/link";

const copy = {
  en: {
    welcome: "Welcome back",
    signedOut: "Start your family vault",
    title: "Family Legacy Vault",
    subtitle: "A simpler mobile home for saving voice, photos, stories, and family memories.",
    signedOutText: "Sign in to create profiles, record memories, and prepare family-approved memorial pages.",
    signIn: "Sign in",
    recordMemory: "Record memory",
    viewLibrary: "View library",
    needsAttention: "Needs attention",
    allGood: "Vault ready",
    nextStep: "Next step",
    nextStepText: "Add a memory to keep your family vault active.",
    progress: "Setup progress",
    complete: "Complete",
    quickStats: "Quick stats",
    profiles: "Profiles",
    memories: "Memories",
    publicPages: "Public pages",
    albums: "Albums",
    consent: "Consent",
    privacy: "Privacy",
    protected: "Protected",
    storage: "Storage",
    recommended: "Recommended next steps",
    addMemory: "Add a memory",
    addMemoryText: "Record a voice note, upload a photo, or save a family story.",
    reviewPage: "Review public page",
    reviewPageText: "Choose which memories can appear on the public memorial page.",
    confirmConsent: "Confirm consent",
    confirmConsentText: "Keep voice, AI, and memorial features grounded in clear authorization.",
  },
  es: {
    welcome: "Bienvenido de nuevo",
    signedOut: "Comienza tu bóveda familiar",
    title: "Bóveda de Legado Familiar",
    subtitle: "Un inicio móvil más simple para guardar voz, fotos, historias y recuerdos familiares.",
    signedOutText: "Inicia sesión para crear perfiles, grabar recuerdos y preparar páginas memoriales aprobadas.",
    signIn: "Iniciar sesión",
    recordMemory: "Grabar recuerdo",
    viewLibrary: "Ver biblioteca",
    needsAttention: "Necesita atención",
    allGood: "Bóveda lista",
    nextStep: "Siguiente paso",
    nextStepText: "Agrega un recuerdo para mantener activa tu bóveda familiar.",
    progress: "Progreso",
    complete: "Completo",
    quickStats: "Estadísticas",
    profiles: "Perfiles",
    memories: "Recuerdos",
    publicPages: "Páginas públicas",
    albums: "Álbumes",
    consent: "Consentimiento",
    privacy: "Privacidad",
    protected: "Protegida",
    storage: "Almacenamiento",
    recommended: "Siguientes pasos recomendados",
    addMemory: "Agrega un recuerdo",
    addMemoryText: "Graba una nota de voz, sube una foto o guarda una historia familiar.",
    reviewPage: "Revisa página pública",
    reviewPageText: "Elige qué recuerdos pueden aparecer en la página memorial pública.",
    confirmConsent: "Confirma consentimiento",
    confirmConsentText: "Mantén voz, IA y funciones memoriales con autorización clara.",
  },
};

export default function MobileDashboard({
  language = "en",
  user,
  stats = {},
  loadingStats = false,
  storageDisplay = "0 KB",
  storagePercent = 0,
}) {
  const t = copy[language] || copy.en;

  const profiles = Number(stats.profiles) || 0;
  const memories = Number(stats.memories) || 0;
  const publicMemorials = Number(stats.publicMemorials) || 0;
  const albums = Number(stats.albums) || 0;
  const consentRecords = Number(stats.consentRecords) || 0;

  const completedItems = [
    profiles > 0,
    memories > 0,
    publicMemorials > 0,
    consentRecords > 0,
    true,
  ];

  const completeCount = completedItems.filter(Boolean).length;
  const totalCount = completedItems.length;
  const progressPercent = Math.round((completeCount / totalCount) * 100);
  const statusReady = completeCount >= 4;

  return (
    <main className="mobileAppDashboard">
      <section className="mobileVaultHero">
        <p className="mobileEyebrow">{user ? t.welcome : t.signedOut}</p>
        <h1>{t.title}</h1>
        <p>{user ? t.subtitle : t.signedOutText}</p>

        <div className="mobileHeroButtons">
          {user ? (
            <>
              <Link href="/app/record" className="mobilePrimaryCta">
                {t.recordMemory}
              </Link>
              <Link href="/app/library" className="mobileSecondaryCta">
                {t.viewLibrary}
              </Link>
            </>
          ) : (
            <Link href="/app/login" className="mobilePrimaryCta">
              {t.signIn}
            </Link>
          )}
        </div>
      </section>

      <section className="mobileVaultStatus">
        <div className="mobileStatusHeader">
          <span className={statusReady ? "mobileStatusIcon ready" : "mobileStatusIcon attention"}>
            {statusReady ? "✓" : "!"}
          </span>

          <div>
            <strong>{statusReady ? t.allGood : t.needsAttention}</strong>
            <p>{t.nextStep}</p>
          </div>
        </div>

        <p>{t.nextStepText}</p>
      </section>

      <section className="mobileProgressPanel">
        <div className="mobilePanelHeader">
          <div>
            <p className="mobileEyebrow">{t.progress}</p>
            <h2>{progressPercent}%</h2>
          </div>
          <span>{completeCount}/{totalCount} {t.complete}</span>
        </div>

        <div className="mobileProgressBar">
          <div style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="mobileChecklistGrid">
          <span className={consentRecords > 0 ? "done" : ""}>✓ {t.consent}</span>
          <span className={profiles > 0 ? "done" : ""}>✓ {t.profiles}</span>
          <span className={memories > 0 ? "done" : ""}>✓ {t.memories}</span>
          <span className={publicMemorials > 0 ? "done" : ""}>✓ {t.publicPages}</span>
        </div>
      </section>

      <section className="mobileStatsPanel">
        <p className="mobileEyebrow">{t.quickStats}</p>

        <div className="mobileStatsGrid">
          <article>
            <span>{t.profiles}</span>
            <strong>{loadingStats ? "—" : profiles}</strong>
          </article>

          <article>
            <span>{t.memories}</span>
            <strong>{loadingStats ? "—" : memories}</strong>
          </article>

          <article>
            <span>{t.publicPages}</span>
            <strong>{loadingStats ? "—" : publicMemorials}</strong>
          </article>

          <article>
            <span>{t.albums}</span>
            <strong>{loadingStats ? "—" : albums}</strong>
          </article>
        </div>
      </section>

      <section className="mobileStoragePanel">
        <div className="mobileStorageCircle" style={{ "--storage-mobile": `${storagePercent}%` }}>
          <span>{storagePercent}%</span>
        </div>

        <div>
          <p className="mobileEyebrow">{t.storage}</p>
          <strong>{storageDisplay}</strong>
          <span>50 MB</span>
        </div>
      </section>

      <section className="mobileNextSteps">
        <p className="mobileEyebrow">Focus</p>
        <h2>{t.recommended}</h2>

        <div className="mobileStepCards">
          <Link href={user ? "/app/record" : "/app/login"}>
            <span>01</span>
            <strong>{t.addMemory}</strong>
            <p>{t.addMemoryText}</p>
          </Link>

          <Link href={user ? "/app/library" : "/app/login"}>
            <span>02</span>
            <strong>{t.reviewPage}</strong>
            <p>{t.reviewPageText}</p>
          </Link>

          <Link href={user ? "/app/consent" : "/app/login"}>
            <span>03</span>
            <strong>{t.confirmConsent}</strong>
            <p>{t.confirmConsentText}</p>
          </Link>
        </div>
      </section>
    </main>
  );
}