"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { relationshipOptions, getRelationshipEnglishLabel } from "../../../../lib/relationshipLabels";
import { useAppLanguage } from "../../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Create Legacy Profile",
    title: "Create a Loved One Profile",
    subtitle:
      "Start a private legacy profile for someone you love. You can add photos, voice memories, videos, stories, and memorial settings afterward.",
    fullName: "Full name",
    fullNamePlaceholder: "Example: Maria Lopez",
    relationship: "Relationship",
    relationshipType: "Relationship type",
    relationshipCustom: "Custom relationship",
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
    guideEyebrow: "Profile guidance",
    guideTitle: "Begin with who they are",
    guideText:
      "A legacy profile is the home for a person's photos, memories, recordings, stories, and memorial page.",
    points: [
      "Start with their full name and relationship.",
      "Add dates if you know them.",
      "Write a short life story now or add it later.",
      "Memories stay private until you choose what to share.",
    ],
    privateTitle: "Private by default",
    privateText:
      "Creating a profile does not make it public. Public memorial pages are optional and controlled later.",
    nextTitle: "After creating the profile",
    nextText:
      "You will be able to upload photos, record voice or video memories, and prepare a public memorial page if you choose.",
  },
  es: {
    eyebrow: "Crear perfil de legado",
    title: "Crear perfil de ser querido",
    subtitle:
      "Comienza un perfil privado de legado para alguien que amas. Después podrás agregar fotos, recuerdos de voz, videos, historias y ajustes memoriales.",
    fullName: "Nombre completo",
    fullNamePlaceholder: "Ejemplo: Rosa Frias Lopez",
    relationship: "Parentesco",
    relationshipType: "Tipo de parentesco",
    relationshipCustom: "Parentesco personalizado",
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
    guideEyebrow: "Guía del perfil",
    guideTitle: "Comienza con quién era",
    guideText:
      "Un perfil de legado es el hogar para las fotos, recuerdos, grabaciones, historias y página memorial de una persona.",
    points: [
      "Comienza con su nombre completo y parentesco.",
      "Agrega fechas si las conoces.",
      "Escribe una historia corta ahora o agrégala después.",
      "Los recuerdos permanecen privados hasta que tú decidas qué compartir.",
    ],
    privateTitle: "Privado por defecto",
    privateText:
      "Crear un perfil no lo hace público. Las páginas memoriales públicas son opcionales y se controlan después.",
    nextTitle: "Después de crear el perfil",
    nextText:
      "Podrás subir fotos, grabar recuerdos de voz o video y preparar una página memorial pública si así lo deseas.",
  },
};

export default function NewLovedOnePage() {
  const router = useRouter();
  const language = useAppLanguage();
  const t = copy[language];

  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [relationshipCustom, setRelationshipCustom] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
        relationship:
          relationshipType === "other"
            ? relationshipCustom.trim() || null
            : getRelationshipEnglishLabel(relationshipType) || relationship.trim() || null,
        relationship_type: relationshipType || null,
        relationship_custom:
          relationshipType === "other" ? relationshipCustom.trim() || null : null,
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
    <main className="appShell createProfileShell">
      <section className="createProfileHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <aside className="createProfileIntroCard">
          <span>VE</span>
          <h2>{t.nextTitle}</h2>
          <p>{t.nextText}</p>
        </aside>
      </section>

      <section className="createProfileGrid">
        <form className="createProfileForm" onSubmit={handleSubmit}>
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

          <label className="fieldLabel" htmlFor="relationshipType">
            {t.relationshipType}
          </label>
          <select
            id="relationshipType"
            className="appInput"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
          >
            <option value="">
              {language === "es" ? "Selecciona parentesco" : "Select relationship"}
            </option>
            {relationshipOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option[language]}
              </option>
            ))}
          </select>

          {relationshipType === "other" && (
            <>
              <label className="fieldLabel" htmlFor="relationshipCustom">
                {t.relationshipCustom}
              </label>
              <input
                id="relationshipCustom"
                className="appInput"
                value={relationshipCustom}
                onChange={(e) => setRelationshipCustom(e.target.value)}
                placeholder={language === "es" ? "Ejemplo: Padrino, Madrina, Mentor" : "Example: Godfather, Godmother, Mentor"}
              />
            </>
          )}

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

        <aside className="createProfileGuideCard">
          <p className="appEyebrow">{t.guideEyebrow}</p>
          <h2>{t.guideTitle}</h2>
          <p>{t.guideText}</p>

          <div className="createProfilePoints">
            {t.points.map((point) => (
              <div className="createProfilePoint" key={point}>
                <span>✓</span>
                <p>{point}</p>
              </div>
            ))}
          </div>

          <div className="privateVaultNote">
            <strong>{t.privateTitle}</strong>
            <p>{t.privateText}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}