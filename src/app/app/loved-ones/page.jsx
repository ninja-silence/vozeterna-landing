"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { getStoredAppLanguage } from "../../../lib/appLanguage";

const copy = {
  en: {
    eyebrow: "Loved One Profiles",
    title: "Legacy Profiles",
    subtitle:
      "Create a profile for each loved one, then connect photos, voice memories, videos, stories, and memorial pages to the right person.",
    newProfile: "Create new profile",
    dashboard: "Back to dashboard",
    signInTitle: "Please sign in",
    signInText: "You need to sign in before viewing your loved one profiles.",
    signIn: "Sign in",
    emptyTitle: "No profiles yet",
    emptyText:
      "Start by creating a loved one profile. After that, you can upload memories, record audio or video, and prepare a public memorial page.",
    relationship: "Relationship",
    born: "Born",
    passed: "Passed",
    publicMemorial: "Public memorial enabled",
    privateProfile: "Private profile",
    open: "Open profile",
    edit: "Edit",
    memorial: "View memorial",
  },
  es: {
    eyebrow: "Perfiles de seres queridos",
    title: "Perfiles de legado",
    subtitle:
      "Crea un perfil para cada ser querido y conecta fotos, recuerdos de voz, videos, historias y páginas memoriales con la persona correcta.",
    newProfile: "Crear nuevo perfil",
    dashboard: "Volver al inicio",
    signInTitle: "Por favor inicia sesión",
    signInText: "Necesitas iniciar sesión antes de ver los perfiles de tus seres queridos.",
    signIn: "Iniciar sesión",
    emptyTitle: "Todavía no hay perfiles",
    emptyText:
      "Comienza creando un perfil de ser querido. Después podrás subir recuerdos, grabar audio o video y preparar una página memorial pública.",
    relationship: "Parentesco",
    born: "Nacimiento",
    passed: "Fallecimiento",
    publicMemorial: "Memorial público activado",
    privateProfile: "Perfil privado",
    open: "Abrir perfil",
    edit: "Editar",
    memorial: "Ver memorial",
  },
};

export default function LovedOnesPage() {
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const t = copy[language];

  useEffect(() => {
    setLanguage(getStoredAppLanguage());

    function handleLanguageChange(event) {
      setLanguage(event.detail?.language || getStoredAppLanguage());
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("vozeterna-language-change", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    async function loadProfiles() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("loved_ones")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        const lovedOnes = data || [];
        setProfiles(lovedOnes);

        const urlMap = {};

        for (const profile of lovedOnes) {
          if (profile.profile_photo_path) {
            const { data: signedData } = await supabase.storage
              .from("family-media")
              .createSignedUrl(profile.profile_photo_path, 60 * 10);

            if (signedData?.signedUrl) {
              urlMap[profile.id] = signedData.signedUrl;
            }
          }
        }

        setSignedUrls(urlMap);
      }

      setLoading(false);
    }

    loadProfiles();
  }, []);

  function formatDate(value) {
    if (!value) return null;

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(`${value}T00:00:00`));
  }

  function getInitials(name) {
    return (
      name
        ?.split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "VE"
    );
  }

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{language === "es" ? "Cargando..." : "Loading..."}</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.signInTitle}</h1>
          <p>{t.signInText}</p>

          <div className="buttonRow">
            <Link href="/app/login" className="appButton">
              {t.signIn}
            </Link>

            <Link href="/app" className="appButton secondary">
              {t.dashboard}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section className="appHero compact">
        <p className="appEyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>

        <div className="buttonRow">
          <Link href="/app/loved-ones/new" className="appButton">
            {t.newProfile}
          </Link>

          <Link href="/app" className="appButton secondary">
            {t.dashboard}
          </Link>
        </div>
      </section>

      {profiles.length === 0 ? (
        <section className="emptyState">
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>

          <Link href="/app/loved-ones/new" className="appButton">
            {t.newProfile}
          </Link>
        </section>
      ) : (
        <section className="profileGrid">
          {profiles.map((profile) => (
            <article className="profileCard" key={profile.id}>
              <div className="profileCardPhoto">
                {signedUrls[profile.id] ? (
                  <img src={signedUrls[profile.id]} alt={profile.full_name} />
                ) : (
                  <span>{getInitials(profile.full_name)}</span>
                )}
              </div>

              <div className="profileCardBody">
                <p className="appEyebrow">
                  {profile.memorial_public ? t.publicMemorial : t.privateProfile}
                </p>

                <h2>{profile.full_name}</h2>

                {profile.relationship && (
                  <p>
                    <strong>{t.relationship}:</strong> {profile.relationship}
                  </p>
                )}

                {profile.birth_date && (
                  <p>
                    <strong>{t.born}:</strong> {formatDate(profile.birth_date)}
                  </p>
                )}

                {profile.death_date && (
                  <p>
                    <strong>{t.passed}:</strong> {formatDate(profile.death_date)}
                  </p>
                )}

                <div className="buttonRow">
                  <Link href={`/app/loved-ones/${profile.id}`} className="appButton">
                    {t.open}
                  </Link>

                  <Link
                    href={`/app/loved-ones/${profile.id}/edit`}
                    className="appButton secondary"
                  >
                    {t.edit}
                  </Link>

                  {profile.memorial_public && profile.memorial_slug && (
                    <Link
                      href={`/memorial/${profile.memorial_slug}`}
                      className="appButton ghost"
                    >
                      {t.memorial}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}