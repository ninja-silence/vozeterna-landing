"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { useAppLanguage } from "../../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "New Collection",
    title: "Create a family album",
    subtitle:
      "Start a curated collection for a person, season, story, trip, voice archive, or memorial slideshow.",
    collectionTitle: "Collection title",
    titlePlaceholder: "Example: Mom's Voice Messages",
    description: "Description",
    descriptionPlaceholder:
      "Describe what this album is for and what kind of memories belong here.",
    lovedOne: "Loved one",
    general: "General family collection",
    publicStatus: "Make collection public later",
    publicHelp:
      "For now, collections are private in the app. Public collection pages can be added later.",
    create: "Create collection",
    creating: "Creating...",
    cancel: "Cancel",
    error: "Something went wrong. Please try again.",
  },
  es: {
    eyebrow: "Nuevo álbum",
    title: "Crear un álbum familiar",
    subtitle:
      "Crea una colección curada para una persona, temporada, historia, viaje, archivo de voz o presentación memorial.",
    collectionTitle: "Título del álbum",
    titlePlaceholder: "Ejemplo: Mensajes de voz de mamá",
    description: "Descripción",
    descriptionPlaceholder:
      "Describe para qué es este álbum y qué tipo de recuerdos pertenecen aquí.",
    lovedOne: "Ser querido",
    general: "Álbum familiar general",
    publicStatus: "Hacer público más adelante",
    publicHelp:
      "Por ahora, los álbumes son privados dentro de la app. Las páginas públicas de álbumes se pueden agregar después.",
    create: "Crear álbum",
    creating: "Creando...",
    cancel: "Cancelar",
    error: "Algo salió mal. Inténtalo de nuevo.",
  },
};

export default function NewCollectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLovedOneId = searchParams.get("lovedOneId") || "";
  const language = useAppLanguage();
  const t = copy[language] || copy.en;

  const [profiles, setProfiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    loved_one_id: preselectedLovedOneId,
    is_public: false,
  });

  useEffect(() => {
    async function loadProfiles() {
      const { data } = await supabase
        .from("loved_ones")
        .select("id, full_name")
        .order("created_at", { ascending: false });

      setProfiles(data || []);
    }

    loadProfiles();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setMessage(language === "es" ? "Agrega un título para el álbum." : "Add a collection title.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setSaving(false);
      setMessage(t.error);
      return;
    }

    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      loved_one_id: form.loved_one_id || null,
      is_public: Boolean(form.is_public),
    };

    const { data, error } = await supabase
      .from("memory_collections")
      .insert(payload)
      .select("id")
      .single();

    setSaving(false);

    if (error || !data?.id) {
      setMessage(error?.message || t.error);
      return;
    }

    router.push(`/app/collections/${data.id}`);
  }

  return (
    <main className="appShell newCollectionShell">
      <section className="appHero compact newCollectionHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <Link href="/app/collections" className="appButton secondary">
          {t.cancel}
        </Link>
      </section>

      <section className="editMemoryCard collectionFormCard">
        {message && <div className="successBox">{message}</div>}

        <form onSubmit={handleSubmit} className="appForm">
          <label>
            {t.collectionTitle}
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={t.titlePlaceholder}
            />
          </label>

          <label>
            {t.description}
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={5}
            />
          </label>

          <label>
            {t.lovedOne}
            <select
              value={form.loved_one_id}
              onChange={(event) => updateField("loved_one_id", event.target.value)}
            >
              <option value="">{t.general}</option>

              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </select>
          </label>

          <label className="toggleSettingRow">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(event) => updateField("is_public", event.target.checked)}
            />

            <span>
              <strong>{t.publicStatus}</strong>
              <small>{t.publicHelp}</small>
            </span>
          </label>

          <div className="buttonRow">
            <button type="submit" className="appButton" disabled={saving}>
              {saving ? t.creating : t.create}
            </button>

            <Link href="/app/collections" className="appButton ghost">
              {t.cancel}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}