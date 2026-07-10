"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useAppLanguage } from "../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Upload Memories",
    title: "Upload a Memory",
    subtitle:
      "Add photos, audio, video, documents, and keepsakes to a loved one's private legacy vault.",
    signInTitle: "Please sign in",
    signInText: "You need to sign in before uploading private family memories.",
    signIn: "Sign in",
    noProfilesTitle: "Create a loved one profile first",
    noProfilesText: "Before uploading memories, create a profile for the person these memories belong to.",
    createProfile: "Create profile",
    back: "Back to dashboard",
    library: "View library",
    who: "Who is this memory for?",
    kind: "What kind of memory is this?",
    note: "Optional memory note",
    notePlaceholder:
      "Example: Family photo from Christmas, Mom's favorite song, Grandpa's prayer, or a keepsake document.",
    chooseFile: "Choose file",
    upload: "Upload memory",
    uploading: "Uploading...",
    success: "Memory uploaded successfully.",
    requiredFile: "Please choose a file.",
    requiredProfile: "Please choose a loved one profile.",
    guideEyebrow: "Before you upload",
    guideTitle: "Preserve it with context",
    guideText:
      "A photo, voice note, video, document, or keepsake becomes more meaningful when future family members understand who it belongs to and why it matters.",
    points: [
      "Memories are private by default.",
      "Choose the loved one this memory belongs to.",
      "Add a note so your family understands the story.",
      "You can choose later whether it appears on a public memorial page.",
    ],
    vaultNoteTitle: "Private family vault",
    vaultNoteText:
      "Nothing you upload here becomes public unless you manually mark it for the memorial page.",
    typeGuideTitle: "Why memory type matters",
    typeGuideText:
      "Memory types help VozEterna organize each item correctly so your family can later browse photos, voices, stories, messages, and keepsakes with more meaning.",
    types: {
      photo_of_person: "Photo of this person",
      photo_from_person: "Photo from this person",
      story_about_person: "Story about this person",
      message_from_person: "Message from this person",
      voice_of_person: "Voice of this person",
      family_memory: "Family memory connected to this person",
      document_or_keepsake: "Document or keepsake",
    },
  },
  es: {
    eyebrow: "Subir recuerdos",
    title: "Subir un recuerdo",
    subtitle:
      "Agrega fotos, audio, video, documentos y recuerdos especiales a la bóveda privada de legado de un ser querido.",
    signInTitle: "Por favor inicia sesión",
    signInText: "Necesitas iniciar sesión antes de subir recuerdos familiares privados.",
    signIn: "Iniciar sesión",
    noProfilesTitle: "Primero crea un perfil de ser querido",
    noProfilesText:
      "Antes de subir recuerdos, crea un perfil para la persona a la que pertenecen estos recuerdos.",
    createProfile: "Crear perfil",
    back: "Volver al inicio",
    library: "Ver biblioteca",
    who: "¿Para quién es este recuerdo?",
    kind: "¿Qué tipo de recuerdo es?",
    note: "Nota opcional del recuerdo",
    notePlaceholder:
      "Ejemplo: Foto familiar de Navidad, canción favorita de mamá, oración del abuelo o un documento especial.",
    chooseFile: "Elegir archivo",
    upload: "Subir recuerdo",
    uploading: "Subiendo...",
    success: "Recuerdo subido correctamente.",
    requiredFile: "Por favor elige un archivo.",
    requiredProfile: "Por favor elige un perfil de ser querido.",
    guideEyebrow: "Antes de subir",
    guideTitle: "Presérvalo con contexto",
    guideText:
      "Una foto, nota de voz, video, documento o recuerdo especial se vuelve más valioso cuando tu familia entiende a quién pertenece y por qué importa.",
    points: [
      "Los recuerdos son privados por defecto.",
      "Elige a qué ser querido pertenece este recuerdo.",
      "Agrega una nota para que tu familia entienda la historia.",
      "Después puedes decidir si aparece en una página memorial pública.",
    ],
    vaultNoteTitle: "Bóveda familiar privada",
    vaultNoteText:
      "Nada de lo que subas aquí se vuelve público a menos que tú lo marques manualmente para la página memorial.",
    typeGuideTitle: "Por qué importa el tipo de recuerdo",
    typeGuideText:
      "Los tipos de recuerdo ayudan a VozEterna a organizar cada elemento para que tu familia pueda encontrar fotos, voces, historias, mensajes y recuerdos especiales con más significado.",
    types: {
      photo_of_person: "Foto de esta persona",
      photo_from_person: "Foto de esta persona o guardada por ella",
      story_about_person: "Historia sobre esta persona",
      message_from_person: "Mensaje de esta persona",
      voice_of_person: "Voz de esta persona",
      family_memory: "Recuerdo familiar conectado a esta persona",
      document_or_keepsake: "Documento o recuerdo especial",
    },
  },
};

export default function UploadPage() {
  const language = useAppLanguage();
  const t = copy[language];

  const [user, setUser] = useState(null);
  const [lovedOnes, setLovedOnes] = useState([]);
  const [selectedLovedOneId, setSelectedLovedOneId] = useState("");
  const [memoryType, setMemoryType] = useState("family_memory");
  const [memoryNote, setMemoryNote] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUploadSetup() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data: profilesData } = await supabase
        .from("loved_ones")
        .select("id, full_name, relationship")
        .order("created_at", { ascending: false });

      const profiles = profilesData || [];
      setLovedOnes(profiles);

      if (profiles.length) {
        const params = new URLSearchParams(window.location.search);
        const requestedLovedOneId = params.get("lovedOneId");
        const profileExists = profiles.some((profile) => profile.id === requestedLovedOneId);

        setSelectedLovedOneId(profileExists ? requestedLovedOneId : profiles[0].id);
      }

      setLoading(false);
    }

    loadUploadSetup();
  }, []);

  function translateRelationship(value) {
    if (!value) return "";

    if (language !== "es") return value;

    const relationshipMap = {
      Mother: "Madre",
      Father: "Padre",
      Brother: "Hermano",
      Sister: "Hermana",
      Grandmother: "Abuela",
      Grandfather: "Abuelo",
      Grandma: "Abuela",
      Grandpa: "Abuelo",
      Aunt: "Tía",
      Uncle: "Tío",
      Cousin: "Primo/a",
      Son: "Hijo",
      Daughter: "Hija",
      Wife: "Esposa",
      Husband: "Esposo",
      Friend: "Amigo/a",
    };

    return relationshipMap[value] || value;
  }

  function getSelectedFileLabel() {
    if (!file) return t.chooseFile;

    const sizeInMb = file.size / 1024 / 1024;
    const readableSize =
      sizeInMb >= 1 ? `${sizeInMb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    return `${file.name} • ${readableSize}`;
  }

  function safeFileName(name) {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  }

  async function handleUpload(e) {
    e.preventDefault();
    setMessage("");

    if (!selectedLovedOneId) {
      setMessage(t.requiredProfile);
      return;
    }

    if (!file) {
      setMessage(t.requiredFile);
      return;
    }

    setSaving(true);

    const cleanName = safeFileName(file.name);
    const filePath = `${user.id}/${selectedLovedOneId}/${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("family-media")
      .upload(filePath, file);

    if (uploadError) {
      setMessage(uploadError.message);
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("media_assets").insert({
      user_id: user.id,
      loved_one_id: selectedLovedOneId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type || null,
      file_size: file.size || null,
      memory_type: memoryType,
      memory_note: memoryNote.trim() || null,
      visibility: "private",
      show_on_memorial: false,
    });

    if (insertError) {
      setMessage(insertError.message);
      setSaving(false);
      return;
    }

    setMessage(t.success);
    setFile(null);
    setMemoryNote("");
    setSaving(false);
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
            <Link href="/app/login" className="appButton">{t.signIn}</Link>
            <Link href="/app" className="appButton secondary">{t.back}</Link>
          </div>
        </section>
      </main>
    );
  }

  if (lovedOnes.length === 0) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.noProfilesTitle}</h1>
          <p>{t.noProfilesText}</p>

          <div className="buttonRow">
            <Link href="/app/loved-ones/new" className="appButton">{t.createProfile}</Link>
            <Link href="/app" className="appButton secondary">{t.back}</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell uploadGuidedShell">
      <section className="uploadGuidedHero">
        <p className="appEyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </section>

      <section className="uploadGuidedGrid">
        <form className="uploadGuidedForm" onSubmit={handleUpload}>
          {message && <div className="successBox">{message}</div>}

          <label className="fieldLabel" htmlFor="lovedOne">{t.who}</label>
          <select
            id="lovedOne"
            className="appInput"
            value={selectedLovedOneId}
            onChange={(e) => setSelectedLovedOneId(e.target.value)}
          >
            {lovedOnes.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}{person.relationship ? ` — ${translateRelationship(person.relationship)}` : ""}
              </option>
            ))}
          </select>

          <label className="fieldLabel" htmlFor="memoryType">{t.kind}</label>
          <select
            id="memoryType"
            className="appInput"
            value={memoryType}
            onChange={(e) => setMemoryType(e.target.value)}
          >
            <option value="family_memory">{t.types.family_memory}</option>
            <option value="photo_of_person">{t.types.photo_of_person}</option>
            <option value="photo_from_person">{t.types.photo_from_person}</option>
            <option value="voice_of_person">{t.types.voice_of_person}</option>
            <option value="message_from_person">{t.types.message_from_person}</option>
            <option value="story_about_person">{t.types.story_about_person}</option>
            <option value="document_or_keepsake">{t.types.document_or_keepsake}</option>
          </select>

          <label className="fieldLabel" htmlFor="memoryNote">{t.note}</label>
          <textarea
            id="memoryNote"
            className="appTextarea"
            value={memoryNote}
            onChange={(e) => setMemoryNote(e.target.value)}
            placeholder={t.notePlaceholder}
          />

          <label className="fieldLabel" htmlFor="memoryFile">{t.chooseFile}</label>
          <label className="uploadDropzone" htmlFor="memoryFile">
            <span>{getSelectedFileLabel()}</span>
            <small>
              {language === "es"
                ? "Fotos, audio, video o documentos especiales"
                : "Photos, audio, video, or keepsake documents"}
            </small>
          </label>
          <input
            id="memoryFile"
            className="visuallyHiddenFile"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <div className="buttonRow">
            <button type="submit" className="appButton" disabled={saving}>
              {saving ? t.uploading : t.upload}
            </button>

            <Link href="/app/library" className="appButton secondary">
              {t.library}
            </Link>
          </div>
        <div className="uploadTypeGuide">
            <strong>{t.typeGuideTitle}</strong>
            <p>{t.typeGuideText}</p>
          </div>
        </form>

        <aside className="uploadGuideCard">
          <p className="appEyebrow">{t.guideEyebrow}</p>
          <h2>{t.guideTitle}</h2>
          <p>{t.guideText}</p>

          <div className="uploadGuidePoints">
            {t.points.map((point) => (
              <div className="uploadGuidePoint" key={point}>
                <span>✓</span>
                <p>{point}</p>
              </div>
            ))}
          </div>

          <div className="privateVaultNote">
            <strong>{t.vaultNoteTitle}</strong>
            <p>{t.vaultNoteText}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}