"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import { useAppLanguage } from "../../../../../lib/useAppLanguage";

const memoryTypes = [
  "photo_of_person",
  "photo_from_person",
  "story_about_person",
  "message_from_person",
  "voice_of_person",
  "family_memory",
  "document_or_keepsake",
];

const copy = {
  en: {
    eyebrow: "Edit Memory",
    loading: "Loading memory...",
    title: "Edit memory details",
    subtitle:
      "Update the note, memory type, loved one connection, and public sharing status.",
    memoryTitle: "Memory title",
    memoryTitlePlaceholder: "Example: Mom singing at Christmas",
    memoryNote: "Memory note",
    memoryNotePlaceholder:
      "Write the story, context, date, or meaning behind this memory.",
    memoryType: "Memory type",
    lovedOne: "Loved one",
    noProfile: "Unassigned memory",
    publicStatus: "Show on memorial page",
    publicHelp:
      "Only enable this if you want this memory to appear on the public memorial or living legacy page.",
    save: "Save changes",
    saving: "Saving...",
    cancel: "Cancel",
    saved: "Memory updated.",
    backDetail: "Back to memory",
    error: "Something went wrong. Please try again.",
    memoryTypes: {
      photo_of_person: "Photo",
      photo_from_person: "Photo from them",
      story_about_person: "Story",
      message_from_person: "Message",
      voice_of_person: "Voice",
      family_memory: "Family Memory",
      document_or_keepsake: "Keepsake",
    },
  },
  es: {
    eyebrow: "Editar recuerdo",
    loading: "Cargando recuerdo...",
    title: "Editar detalles del recuerdo",
    subtitle:
      "Actualiza la nota, el tipo de recuerdo, la conexión con el ser querido y el estado público.",
    memoryTitle: "Título del recuerdo",
    memoryTitlePlaceholder: "Ejemplo: Mamá cantando en Navidad",
    memoryNote: "Nota del recuerdo",
    memoryNotePlaceholder:
      "Escribe la historia, contexto, fecha o significado de este recuerdo.",
    memoryType: "Tipo de recuerdo",
    lovedOne: "Ser querido",
    noProfile: "Recuerdo sin perfil",
    publicStatus: "Mostrar en página memorial",
    publicHelp:
      "Activa esto solo si deseas que este recuerdo aparezca en la página memorial o legado en vida.",
    save: "Guardar cambios",
    saving: "Guardando...",
    cancel: "Cancelar",
    saved: "Recuerdo actualizado.",
    backDetail: "Volver al recuerdo",
    error: "Algo salió mal. Inténtalo de nuevo.",
    memoryTypes: {
      photo_of_person: "Foto",
      photo_from_person: "Foto de esa persona",
      story_about_person: "Historia",
      message_from_person: "Mensaje",
      voice_of_person: "Voz",
      family_memory: "Recuerdo familiar",
      document_or_keepsake: "Recuerdo especial",
    },
  },
};

export default function EditMemoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const language = useAppLanguage();
  const t = copy[language] || copy.en;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profiles, setProfiles] = useState([]);

  const [form, setForm] = useState({
    title: "",
    memory_note: "",
    memory_type: "family_memory",
    loved_one_id: "",
    show_on_memorial: false,
  });

  useEffect(() => {
    async function loadData() {
      const [{ data: memoryData, error: memoryError }, { data: profileData }] =
        await Promise.all([
          supabase.from("media_assets").select("*").eq("id", id).maybeSingle(),
          supabase.from("loved_ones").select("id, full_name").order("created_at", {
            ascending: false,
          }),
        ]);

      if (memoryError || !memoryData) {
        setLoading(false);
        setMessage(t.error);
        return;
      }

      setProfiles(profileData || []);
      setForm({
        title: memoryData.title || "",
        memory_note: memoryData.memory_note || "",
        memory_type: memoryData.memory_type || "family_memory",
        loved_one_id: memoryData.loved_one_id || "",
        show_on_memorial: Boolean(memoryData.show_on_memorial),
      });

      setLoading(false);
    }

    loadData();
  }, [id, t.error]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      title: form.title.trim() || null,
      memory_note: form.memory_note.trim() || null,
      memory_type: form.memory_type,
      loved_one_id: form.loved_one_id || null,
      show_on_memorial: form.show_on_memorial,
    };

    const { error } = await supabase.from("media_assets").update(payload).eq("id", id);

    setSaving(false);

    if (error) {
      setMessage(error.message || t.error);
      return;
    }

    setMessage(t.saved);

    setTimeout(() => {
      router.push(`/app/memories/${id}`);
    }, 700);
  }

  if (loading) {
    return (
      <main className="appShell editMemoryShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.loading}</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell editMemoryShell">
      <section className="appHero compact editMemoryHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <Link href={`/app/memories/${id}`} className="appButton secondary">
          {t.backDetail}
        </Link>
      </section>

      <section className="editMemoryCard">
        {message && <div className="successBox">{message}</div>}

        <form onSubmit={handleSubmit} className="appForm">
          <label>
            {t.memoryTitle}
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={t.memoryTitlePlaceholder}
            />
          </label>

          <label>
            {t.memoryNote}
            <textarea
              value={form.memory_note}
              onChange={(event) => updateField("memory_note", event.target.value)}
              placeholder={t.memoryNotePlaceholder}
              rows={6}
            />
          </label>

          <label>
            {t.memoryType}
            <select
              value={form.memory_type}
              onChange={(event) => updateField("memory_type", event.target.value)}
            >
              {memoryTypes.map((type) => (
                <option key={type} value={type}>
                  {t.memoryTypes[type]}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t.lovedOne}
            <select
              value={form.loved_one_id}
              onChange={(event) => updateField("loved_one_id", event.target.value)}
            >
              <option value="">{t.noProfile}</option>

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
              checked={form.show_on_memorial}
              onChange={(event) => updateField("show_on_memorial", event.target.checked)}
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

            <Link href={`/app/memories/${id}`} className="appButton ghost">
              {t.cancel}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}