"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Edit album",
    loading: "Loading album...",
    title: "Edit album details",
    subtitle: "Update the title, description, loved one connection, and privacy label.",
    albumTitle: "Album title",
    titlePlaceholder: "Example: Mom's Voice Messages",
    description: "Description",
    descriptionPlaceholder: "What kind of memories belong in this album?",
    lovedOne: "Loved one",
    general: "General family album",
    publicStatus: "Mark as public later",
    publicHelp: "For now, this only labels the album. Keep family albums private unless you are sure.",
    save: "Save changes",
    saving: "Saving...",
    back: "Back to album",
    saved: "Album updated.",
    deleteAlbum: "Delete album",
    deleteConfirm: "Delete this album? Memories will stay in your library, but this album will be removed.",
    deleted: "Album deleted.",
    error: "Something went wrong. Please try again.",
    notFound: "Album not found",
    missingTitle: "Add an album title.",
  },
  es: {
    label: "Editar álbum",
    loading: "Cargando álbum...",
    title: "Editar detalles del álbum",
    subtitle: "Actualiza el título, descripción, conexión con ser querido y etiqueta de privacidad.",
    albumTitle: "Título del álbum",
    titlePlaceholder: "Ejemplo: Mensajes de voz de mamá",
    description: "Descripción",
    descriptionPlaceholder: "¿Qué tipo de recuerdos pertenecen en este álbum?",
    lovedOne: "Ser querido",
    general: "Álbum familiar general",
    publicStatus: "Marcar como público después",
    publicHelp: "Por ahora, esto solo etiqueta el álbum. Mantén los álbumes familiares privados salvo que estés seguro.",
    save: "Guardar cambios",
    saving: "Guardando...",
    back: "Volver al álbum",
    saved: "Álbum actualizado.",
    deleteAlbum: "Eliminar álbum",
    deleteConfirm: "¿Eliminar este álbum? Los recuerdos permanecerán en tu biblioteca, pero el álbum será eliminado.",
    deleted: "Álbum eliminado.",
    error: "Algo salió mal. Inténtalo de nuevo.",
    notFound: "Álbum no encontrado",
    missingTitle: "Agrega un título para el álbum.",
  },
};

export default function MobileEditCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [language, setLanguage] = useState("en");
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

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());
  }, []);

  useEffect(() => {
    async function loadData() {
      const [{ data: collectionData, error: collectionError }, { data: profileData }] =
        await Promise.all([
          supabase.from("memory_collections").select("*").eq("id", id).maybeSingle(),
          supabase.from("loved_ones").select("id, full_name").order("created_at", { ascending: false }),
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

    if (id) {
      loadData();
    }
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
      router.push("/mobile/collections");
    }, 700);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setMessage(t.missingTitle);
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
      router.push(`/mobile/collections/${id}`);
    }, 700);
  }

  if (loading) {
    return (
      <section className="mobileScreenStack mobileAlbumsPolish">
        <section className="mobileAlbumHeroCard">
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.loading}</h1>
        </section>
      </section>
    );
  }

  if (!found) {
    return (
      <section className="mobileScreenStack mobileAlbumsPolish">
        <section className="mobileAlbumHeroCard">
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.notFound}</h1>

          <Link href="/mobile/collections" className="mobileAlbumPrimaryBtn">
            {t.back}
          </Link>
        </section>
      </section>
    );
  }

  return (
    <section className="mobileScreenStack mobileAlbumsPolish">
      <section className="mobileAlbumHeroCard">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p className="mobileAlbumSubtitle">{t.subtitle}</p>
      </section>

      <form onSubmit={handleSubmit} className="mobileAlbumFormCard">
        {message && <p className="mobileFormMessage">{message}</p>}

        <div className="mobileAlbumStack">
          <div className="mobileAlbumField">
            <label>{t.albumTitle}</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={t.titlePlaceholder}
              className="mobileAlbumInput"
            />
          </div>

          <div className="mobileAlbumField">
            <label>{t.description}</label>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={5}
              className="mobileAlbumTextarea"
            />
          </div>

          <div className="mobileAlbumField">
            <label>{t.lovedOne}</label>
            <select
              value={form.loved_one_id}
              onChange={(event) => updateField("loved_one_id", event.target.value)}
              className="mobileAlbumSelect"
            >
              <option value="">{t.general}</option>

              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </select>
          </div>

          <label className="mobileAlbumToggleRow">
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

          <div className="mobileAlbumActionRow">
            <button type="submit" className="mobileAlbumPrimaryBtn" disabled={saving}>
              {saving ? t.saving : t.save}
            </button>

            <Link href={`/mobile/collections/${id}`} className="mobileAlbumGhostBtn">
              {t.back}
            </Link>

            <button type="button" className="mobileAlbumDangerBtn" onClick={deleteCollection} disabled={saving}>
              {t.deleteAlbum}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}