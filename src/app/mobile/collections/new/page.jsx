"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderHeart } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "New album",
    title: "Create a family album",
    subtitle: "Start a private collection for a person, event, voice archive, blessing, or story.",
    albumTitle: "Album title",
    titlePlaceholder: "Example: Mom's Voice Messages",
    description: "Description",
    descriptionPlaceholder: "What kind of memories belong in this album?",
    lovedOne: "Loved one",
    general: "General family album",
    publicStatus: "Mark as public later",
    publicHelp: "For now, this only labels the album. Keep family albums private unless you are sure.",
    create: "Create album",
    creating: "Creating...",
    cancel: "Cancel",
    error: "Something went wrong. Please try again.",
    missingTitle: "Add an album title.",
  },
  es: {
    label: "Nuevo album",
    title: "Crear un album familiar",
    subtitle: "Crea una coleccion privada para una persona, evento, archivo de voz, bendicion o historia.",
    albumTitle: "Titulo del album",
    titlePlaceholder: "Ejemplo: Mensajes de voz de mama",
    description: "Descripcion",
    descriptionPlaceholder: "Que tipo de recuerdos pertenecen en este album?",
    lovedOne: "Ser querido",
    general: "Album familiar general",
    publicStatus: "Marcar como publico despues",
    publicHelp: "Por ahora, esto solo etiqueta el album. Manten los albumes familiares privados salvo que estes seguro.",
    create: "Crear album",
    creating: "Creando...",
    cancel: "Cancelar",
    error: "Algo salio mal. Intentalo de nuevo.",
    missingTitle: "Agrega un titulo para el album.",
  },
};
export default function MobileNewCollectionPage() {
  const router = useRouter();

  const [language, setLanguage] = useState("en");
  const [profiles, setProfiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    loved_one_id: "",
    is_public: false,
  });

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());

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

    const cleanTitle = form.title.trim();

    if (!cleanTitle) {
      setMessage(t.missingTitle);
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
      title: cleanTitle,
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

    router.push(`/mobile/collections/${data.id}`);
  }

  return (
    <section className="mobileScreenStack mobileAlbumsPolish">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="mobileFormCard">
        <div className="mobileFeatureIcon">
          <FolderHeart size={24} />
        </div>

        {message && <p className="mobileFormMessage">{message}</p>}

        <form onSubmit={handleSubmit} className="mobileFormStack">
          <label>
            {t.albumTitle}
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
              rows={4}
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

          <label className="mobileCheckboxRow">
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

          <button type="submit" className="mobileRecorderPrimary" disabled={saving}>
            {saving ? t.creating : t.create}
          </button>

          <Link href="/mobile/collections" className="mobileSecondaryButton">
            {t.cancel}
          </Link>
        </form>
      </section>
    </section>
  );
}