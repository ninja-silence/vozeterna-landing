"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { getStoredAppLanguage } from "../../../../lib/appLanguage";

const copy = {
  en: {
    eyebrow: "Create Profile",
    title: "Create a Loved One Profile",
    subtitle:
      "Start a private legacy profile for someone you love. You can add photos, voice memories, videos, stories, and memorial settings afterward.",
    fullName: "Full name",
    fullNamePlaceholder: "Example: Rosa Frias Lopez",
    relationship: "Relationship",
    relationshipPlaceholder: "Example: Mother, Father, Grandmother, Brother",
    birthDate: "Birth date",
    deathDate: "Death date",
    bio: "Short bio or life story",
    bioPlaceholder:
      "Write a short description, favorite memory, family role, faith, personality, or anything you want preserved.",
    create: "Create profile",
    creating: "Creating...",
    cancel: "Cancel",
    signInTitle: "Please sign in",
    signInText: "You need to sign in before creating a loved one profile.",
    signIn: "Sign in",
    required: "Full name is required.",
    created: "Profile created successfully.",
  },
  es: {
    eyebrow: "Crear perfil",
    title: "Crear perfil de ser querido",
    subtitle:
      "Comienza un perfil privado de legado para alguien que amas. Después podrás agregar fotos, recuerdos de voz, videos, historias y ajustes memoriales.",
    fullName: "Nombre completo",
    fullNamePlaceholder: "Ejemplo: Rosa Frias Lopez",
    relationship: "Parentesco",
    relationshipPlaceholder: "Ejemplo: Madre, Padre, Abuela, Hermano",
    birthDate: "Fecha de nacimiento",
    deathDate: "Fecha de fallecimiento",
    bio: "Biografía corta o historia de vida",
    bioPlaceholder:
      "Escribe una descripción corta, recuerdo favorito, rol familiar, fe, personalidad o algo que quieras preservar.",
    create: "Crear perfil",
    creating: "Creando...",
    cancel: "Cancelar",
    signInTitle: "Por favor inicia sesión",
    signInText: "Necesitas iniciar sesión antes de crear un perfil de ser querido.",
    signIn: "Iniciar sesión",
    required: "El nombre completo es obligatorio.",
    created: "Perfil creado correctamente.",
  },
};

export default function NewLovedOnePage() {
  const router = useRouter();

  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
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
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    }

    loadUser();
  }, []);

  function makeSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!fullName.trim()) {
      setMessage(t.required);
      return;
    }

    if (!user) {
      setMessage(t.signInText);
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("loved_ones")
      .insert({
        user_id: user.id,
        full_name: fullName.trim(),
        relationship: relationship.trim() || null,
        birth_date: birthDate || null,
        death_date: deathDate || null,
        bio: bio.trim() || null,
        memorial_public: false,
        memorial_slug: makeSlug(fullName),
      })
      .select("id")
      .single();

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage(t.created);
    router.push(`/app/loved-ones/${data.id}`);
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

            <Link href="/app/loved-ones" className="appButton secondary">
              {t.cancel}
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
      </section>

      <form className="profileForm" onSubmit={handleSubmit}>
        {message && <div className="successBox">{message}</div>}

        <label className="fieldLabel" htmlFor="fullName">
          {t.fullName}
        </label>
        <input
          id="fullName"
          className="appInput"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t.fullNamePlaceholder}
        />

        <label className="fieldLabel" htmlFor="relationship">
          {t.relationship}
        </label>
        <input
          id="relationship"
          className="appInput"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder={t.relationshipPlaceholder}
        />

        <div className="twoColumnFields">
          <div>
            <label className="fieldLabel" htmlFor="birthDate">
              {t.birthDate}
            </label>
            <input
              id="birthDate"
              className="appInput"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div>
            <label className="fieldLabel" htmlFor="deathDate">
              {t.deathDate}
            </label>
            <input
              id="deathDate"
              className="appInput"
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
            />
          </div>
        </div>

        <label className="fieldLabel" htmlFor="bio">
          {t.bio}
        </label>
        <textarea
          id="bio"
          className="appTextarea"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t.bioPlaceholder}
        />

        <div className="buttonRow">
          <button className="appButton" type="submit" disabled={saving}>
            {saving ? t.creating : t.create}
          </button>

          <Link href="/app/loved-ones" className="appButton secondary">
            {t.cancel}
          </Link>
        </div>
      </form>
    </main>
  );
}