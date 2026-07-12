"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Save } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { createMobileVault } from "../../../../lib/mobileVault";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Create Profile",
    title: "New loved one vault",
    subtitle: "Create a private family profile that can hold memories, photos, videos, and reflections.",
    name: "Name",
    namePlaceholder: "Example: Maria Lopez",
    relationship: "Relationship",
    relationshipPlaceholder: "Mother, father, brother, friend...",
    description: "Short description",
    descriptionPlaceholder: "Write a short note about this person or vault.",
    save: "Create profile",
    saving: "Creating...",
    saved: "Profile created.",
    signIn: "Please sign in before creating a profile.",
    required: "Please enter a name.",
  },
  es: {
    label: "Crear perfil",
    title: "Nueva bóveda familiar",
    subtitle: "Crea un perfil privado para guardar recuerdos, fotos, videos y reflexiones.",
    name: "Nombre",
    namePlaceholder: "Ejemplo: Maria Lopez",
    relationship: "Relación",
    relationshipPlaceholder: "Mamá, papá, hermano, amigo...",
    description: "Descripción corta",
    descriptionPlaceholder: "Escribe una nota corta sobre esta persona o bóveda.",
    save: "Crear perfil",
    saving: "Creando...",
    saved: "Perfil creado.",
    signIn: "Inicia sesión antes de crear un perfil.",
    required: "Escribe un nombre.",
  },
};

export default function MobileCreateProfilePage() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [subjectName, setSubjectName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const t = copy[language] || copy.en;

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

  async function createProfile(event) {
    event.preventDefault();
    setMessage("");

    if (!subjectName.trim()) {
      setMessage(t.required);
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(t.signIn);
        setSaving(false);
        return;
      }

      await createMobileVault({
        supabase,
        user,
        subjectName,
        relationshipLabel: relationship,
        description,
      });

      setMessage(t.saved);

      window.setTimeout(() => {
        router.push("/mobile/profiles");
      }, 650);
    } catch (error) {
      setMessage(error.message || "Could not create profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <form className="mobileFormCard" onSubmit={createProfile}>
        <label>
          {t.name}
          <input
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            placeholder={t.namePlaceholder}
          />
        </label>

        <label>
          {t.relationship}
          <input
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            placeholder={t.relationshipPlaceholder}
          />
        </label>

        <label>
          {t.description}
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t.descriptionPlaceholder}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Save size={17} />
              {t.saving}
            </>
          ) : (
            <>
              <Save size={17} />
              {t.save}
            </>
          )}
        </button>

        {message && (
          <p className={message === t.saved ? "mobileSuccessMessage" : "mobileFormMessage"}>
            {message === t.saved && <CheckCircle2 size={16} />}
            <span>{message}</span>
          </p>
        )}
      </form>
    </section>
  );
}