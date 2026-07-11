"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import { useAppLanguage } from "../../../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Edit Collection",
    loading: "Loading collection...",
    title: "Edit album details",
    subtitle:
      "Update the album title, description, loved one connection, and sharing status.",
    collectionTitle: "Collection title",
    titlePlaceholder: "Example: Mom's Voice Messages",
    description: "Description",
    descriptionPlaceholder:
      "Describe what this album is for and what kind of memories belong here.",
    lovedOne: "Loved one",
    general: "General family collection",
    publicStatus: "Mark collection public",
    publicHelp:
      "For now, this only labels the collection. Public collection pages can be added later.",
    save: "Save changes",
    saving: "Saving...",
    cancel: "Cancel",
    back: "Back to collection",
    saved: "Collection updated.",
    deleteCollection: "Delete collection",
    deleteConfirm: "Delete this collection? Memories will stay in your library, but this album will be removed.",
    deleted: "Collection deleted.",
    error: "Something went wrong. Please try again.",
    notFound: "Collection not found",
  },
  es: {
    eyebrow: "Editar álbum",
    loading: "Cargando álbum...",
    title: "Editar detalles del álbum",
    subtitle:
      "Actualiza el título, descripción, conexión con ser querido y estado público.",
    collectionTitle: "Título del álbum",
    titlePlaceholder: "Ejemplo: Mensajes de voz de mamá",
    description: "Descripción",
    descriptionPlaceholder:
      "Describe para qué es este álbum y qué tipo de recuerdos pertenecen aquí.",
    lovedOne: "Ser querido",
    general: "Álbum familiar general",
    publicStatus: "Marcar álbum como público",
    publicHelp:
      "Por ahora, esto solo etiqueta el álbum. Las páginas públicas de álbumes se pueden agregar después.",
    save: "Guardar cambios",
    saving: "Guardando...",
    cancel: "Cancelar",
    back: "Volver al álbum",
    saved: "Álbum actualizado.",
    deleteCollection: "Eliminar álbum",
    deleteConfirm: "¿Eliminar este álbum? Los recuerdos permanecerán en tu biblioteca, pero el álbum será eliminado.",
    deleted: "Álbum eliminado.",
    error: "Algo salió mal. Inténtalo de nuevo.",
    notFound: "Álbum no encontrado",
  },
};

export default function EditCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const language = useAppLanguage();
  const t = copy[language] || copy.en;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [found, setFound] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    loved_one_id: "",
    is_public: false,
  });

  useEffect(() => {
    async function loadData() {
      const [{ data: collectionData, error: collectionError }, { data: profileData }] =
        await Promise.all([
          supabase.from("memory_collections").select("*").eq("id", id).maybeSingle(),
          supabase
            .from("loved_ones")
            .select("id, full_name")
            .order("created_at", { ascending: false }),
        ]);

      if (collectionError || !collectionData) {
        setFound(false);
        setLoading(false);
        return;
      }

      setProfiles(profileData || []);
      setForm({
        title: collectionData.title || "",
        description: collectionData.description || "",
        loved_one_id: collectionData.loved_one_id || "",
        is_public: Boolean(collectionData.is_public),
      });

      setLoading(false);
    }

    loadData();
  }, [id]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function deleteCollection() {
    const confirmed = window.confirm(t.deleteConfirm);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("memory_collections")
      .delete()
      .eq("id", id);

    setSaving(false);

    if (error) {
      setMessage(error.message || t.error);
      return;
    }

    setMessage(t.deleted);

    setTimeout(() => {
      router.push("/app/collections");
    }, 700);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setMessage(language === "es" ? "Agrega un título para el álbum." : "Add a collection title.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      loved_one_id: form.loved_one_id || null,
      is_public: Boolean(form.is_public),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("memory_collections")
      .update(payload)
      .eq("id", id);

    setSaving(false);

    if (error) {
      setMessage(error.message || t.error);
      return;
    }

    setMessage(t.saved);

    setTimeout(() => {
      router.push(`/app/collections/${id}`);
    }, 700);
  }

  if (loading) {
    return (
      <main className="appShell editCollectionShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.loading}</h1>
        </section>
      </main>
    );
  }

  if (!found) {
    return (
      <main className="appShell editCollectionShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.notFound}</h1>

          <Link href="/app/collections" className="appButton">
            {t.cancel}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell editCollectionShell">
      <section className="appHero compact newCollectionHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <Link href={`/app/collections/${id}`} className="appButton secondary">
          {t.back}
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
              {saving ? t.saving : t.save}
            </button>

            <Link href={`/app/collections/${id}`} className="appButton ghost">
              {t.cancel}
            </Link>

            <button
              type="button"
              className="appButton dangerButton"
              onClick={deleteCollection}
              disabled={saving}
            >
              {t.deleteCollection}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}