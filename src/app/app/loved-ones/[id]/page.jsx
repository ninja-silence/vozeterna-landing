"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MemoryActions from "../../../../components/app/MemoryActions";
import MemorialQrCode from "../../../../components/app/MemorialQrCode";
import { supabase } from "../../../../lib/supabaseClient";
import { getRelationshipLabel } from "../../../../lib/relationshipLabels";
import { getStoredAppLanguage } from "../../../../lib/appLanguage";

const copy = {
  en: {
    loading: "Loading...",
    notFound: "Profile not found",
    notFoundText: "This loved one profile may not exist or you may not have access to it.",
    profile: "Legacy Profile",
    publicMemorial: "Public memorial enabled",
    livingLegacy: "Living legacy page enabled",
    livingLegacy: "Living legacy page enabled",
    privateProfile: "Private profile",
    relationship: "Relationship",
    born: "Born",
    passed: "Passed",
    backProfiles: "Back to profiles",
    editProfile: "Edit profile",
    uploadMemory: "Upload memory",
    recordMemory: "Record memory",
    lifeStory: "Life Story",
    noLifeStory: "No life story has been added yet.",
    memories: "Private Vault Memories",
    memoriesText:
      "These memories are stored in your private family vault. Only memories you approve will appear on the public page.",
    noMemories: "No memories added yet",
    noMemoriesText:
      "Upload a photo, audio message, video, document, or record a memory connected to this profile.",
    addedPublic: "Memory added to public memorial page.",
    removedPublic: "Memory hidden from public memorial page.",
    deleted: "Memory deleted.",
    viewDetails: "View details",
    deleteConfirm: "Delete this memory? This cannot be undone.",
    publicBadge: "Public on memorial",
    privateBadge: "Private",
    saved: "Saved",
    unknownDate: "Unknown date",
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
    loading: "Cargando...",
    notFound: "Perfil no encontrado",
    notFoundText: "Este perfil puede no existir o quizá no tienes acceso.",
    profile: "Perfil de legado",
    publicMemorial: "Memorial público activado",
    livingLegacy: "Legado en vida activado",
    livingLegacy: "Legado en vida activado",
    privateProfile: "Perfil privado",
    relationship: "Parentesco",
    born: "Nacimiento",
    passed: "Fallecimiento",
    backProfiles: "Volver a perfiles",
    editProfile: "Editar perfil",
    uploadMemory: "Subir recuerdo",
    recordMemory: "Grabar recuerdo",
    lifeStory: "Historia de vida",
    noLifeStory: "Todavía no se ha agregado una historia de vida.",
    memories: "Recuerdos de la bóveda privada",
    memoriesText:
      "Estos recuerdos están guardados en tu bóveda familiar privada. Solo los recuerdos que apruebes aparecerán en la página pública.",
    noMemories: "Todavía no hay recuerdos",
    noMemoriesText:
      "Sube una foto, mensaje de audio, video, documento o graba un recuerdo conectado a este perfil.",
    addedPublic: "Recuerdo agregado a la página memorial pública.",
    removedPublic: "Recuerdo ocultado de la página memorial pública.",
    deleted: "Recuerdo eliminado.",
    viewDetails: "Ver detalles",
    deleteConfirm: "¿Eliminar este recuerdo? Esta acción no se puede deshacer.",
    publicBadge: "Público en memorial",
    privateBadge: "Privado",
    saved: "Guardado",
    unknownDate: "Fecha desconocida",
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

export default function LovedOneDetailPage() {
  const params = useParams();
  const id = params.id;

  const [language, setLanguage] = useState("en");
  const [person, setPerson] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [memories, setMemories] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
    async function loadProfile() {
      const { data: profileData, error: profileError } = await supabase
        .from("loved_ones")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (profileError || !profileData) {
        setLoading(false);
        return;
      }

      setPerson(profileData);

      if (profileData.profile_photo_path) {
        const { data: signedPhotoData } = await supabase.storage
          .from("family-media")
          .createSignedUrl(profileData.profile_photo_path, 60 * 10);

        if (signedPhotoData?.signedUrl) {
          setPhotoUrl(signedPhotoData.signedUrl);
        }
      }

      const { data: memoryData } = await supabase
        .from("media_assets")
        .select("*")
        .eq("loved_one_id", id)
        .order("created_at", { ascending: false });

      const profileMemories = memoryData || [];
      setMemories(profileMemories);

      const urlMap = {};

      for (const memory of profileMemories) {
        const { data: signedData } = await supabase.storage
          .from("family-media")
          .createSignedUrl(memory.file_path, 60 * 10);

        if (signedData?.signedUrl) {
          urlMap[memory.id] = signedData.signedUrl;
        }
      }

      setSignedUrls(urlMap);
      setLoading(false);
    }

    loadProfile();
  }, [id]);

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

  function formatDate(value) {
    if (!value) return null;

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(`${value}T00:00:00`));
  }

  function formatCreatedDate(value) {
    if (!value) return t.unknownDate;

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(value));
  }

  function getFileKind(fileName, fileType) {
    const type = fileType || "";
    const lower = fileName.toLowerCase();

    if (type.startsWith("image/") || lower.match(/\.(jpg|jpeg|png|webp)$/)) return "image";
    if (type.startsWith("audio/") || lower.match(/\.(mp3|wav|webm|mpeg)$/)) return "audio";
    if (type.startsWith("video/") || lower.match(/\.(mp4|mov|webm|quicktime)$/)) return "video";

    return "file";
  }

  function formatMemoryType(type) {
    return t.memoryTypes[type] || (language === "es" ? "Recuerdo" : "Memory");
  }

  async function toggleMemoryPublic(memory) {
    const nextValue = !memory.show_on_memorial;

    const { error } = await supabase
      .from("media_assets")
      .update({ show_on_memorial: nextValue })
      .eq("id", memory.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMemories((current) =>
      current.map((item) =>
        item.id === memory.id ? { ...item, show_on_memorial: nextValue } : item
      )
    );

    setMessage(nextValue ? t.addedPublic : t.removedPublic);
  }

  async function deleteMemory(memory) {
    const confirmed = window.confirm(t.deleteConfirm);

    if (!confirmed) return;

    await supabase.storage.from("family-media").remove([memory.file_path]);

    const { error } = await supabase.from("media_assets").delete().eq("id", memory.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMemories((current) => current.filter((item) => item.id !== memory.id));
    setMessage(t.deleted);
  }

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.profile}</p>
          <h1>{t.loading}</h1>
        </section>
      </main>
    );
  }

  if (!person) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.profile}</p>
          <h1>{t.notFound}</h1>
          <p>{t.notFoundText}</p>

          <Link href="/app/loved-ones" className="appButton">
            {t.backProfiles}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell personVaultShell">
      <section className="personVaultHero">
        <div className="personVaultPhotoWrap">
          <div className={`personVaultPhoto ${person.frame_style || "classic_gold"}`}>
            {photoUrl ? (
              <img src={photoUrl} alt={person.full_name} />
            ) : (
              <span>{getInitials(person.full_name)}</span>
            )}
          </div>
        </div>

        <div className="personVaultInfo">
          <p className="appEyebrow">
            {person.memorial_public ? (person.death_date ? t.publicMemorial : t.livingLegacy) : t.privateProfile}
          </p>

          <h1>{person.full_name}</h1>

          <div className="personVaultDetails">
            {getRelationshipLabel(person, language) && (
              <p>
                <strong>{t.relationship}:</strong> {getRelationshipLabel(person, language)}
              </p>
            )}

            {person.birth_date && (
              <p>
                <strong>{t.born}:</strong> {formatDate(person.birth_date)}
              </p>
            )}

            {person.death_date && (
              <p>
                <strong>{t.passed}:</strong> {formatDate(person.death_date)}
              </p>
            )}
          </div>

          <div className="buttonRow">
            <Link href="/app/loved-ones" className="appButton secondary">
              {t.backProfiles}
            </Link>

            <Link href={`/app/loved-ones/${person.id}/edit`} className="appButton">
              {t.editProfile}
            </Link>

            <Link href={`/app/upload?lovedOneId=${person.id}`} className="appButton ghost">
              {t.uploadMemory}
            </Link>

            <Link href={`/app/record?lovedOneId=${person.id}`} className="appButton ghost">
              {t.recordMemory}
            </Link>
          </div>
        </div>
      </section>

      <section className="personVaultMiddleGrid">
        <article className="personStoryCard">
          <p className="appEyebrow">{t.lifeStory}</p>
          <h2>{t.lifeStory}</h2>
          <p>{language === "es" ? person.bio_es || person.bio || t.noLifeStory : person.bio || person.bio_es || t.noLifeStory}</p>
        </article>

        {person.memorial_public && person.memorial_slug ? (
          <MemorialQrCode
            url={`${window.location.origin}/memorial/${person.memorial_slug}`}
            language={language}
          />
        ) : (
          <article className="personPrivacyCard">
            <span>VE</span>
            <h2>{language === "es" ? "Bóveda privada" : "Private vault"}</h2>
            <p>
              {language === "es"
                ? "Este perfil está protegido. Puedes activar una página memorial pública desde Editar perfil."
                : "This profile is protected. You can enable a public memorial page from Edit profile."}
            </p>
          </article>
        )}
      </section>

      <section className="personMemoriesSection">
        <div className="personMemoriesHeader">
          <div>
            <p className="appEyebrow">{t.memories}</p>
            <h2>{t.memories}</h2>
            <p>{t.memoriesText}</p>
          </div>

          <div className="buttonRow">
            <Link href={`/app/upload?lovedOneId=${person.id}`} className="appButton">
              {t.uploadMemory}
            </Link>

            <Link href={`/app/record?lovedOneId=${person.id}`} className="appButton secondary">
              {t.recordMemory}
            </Link>
          </div>
        </div>

        {message && <div className="successBox personVaultMessage">{message}</div>}

        {memories.length === 0 ? (
          <div className="emptyState">
            <h2>{t.noMemories}</h2>
            <p>{t.noMemoriesText}</p>
          </div>
        ) : (
          <div className="memoryGalleryGrid personMemoryGrid">
            {memories.map((memory) => {
              const kind = getFileKind(memory.file_name, memory.file_type);
              const url = signedUrls[memory.id];

              return (
                <article className="memoryGalleryCard" key={memory.id}>
                  <div className="memoryGalleryPreview">
                    {kind === "image" && url && <img src={url} alt={memory.file_name} />}
                    {kind === "audio" && url && (
                      <div className="audioMemoryPreview">
                        <span>♪</span>
                        <audio controls src={url} />
                      </div>
                    )}
                    {kind === "video" && url && <video controls src={url} />}
                    {kind === "file" && <span className="fileMemoryIcon">VE</span>}

                    <div className="memoryGalleryOverlay">
                      <span>{formatMemoryType(memory.memory_type)}</span>
                      <span className={memory.show_on_memorial ? "publicStatus" : "privateStatus"}>
                        {memory.show_on_memorial ? t.publicBadge : t.privateBadge}
                      </span>
                    </div>

                    <MemoryActions
                      url={url}
                      memoryName={memory.file_name}
                      language={language}
                      isPublic={Boolean(memory.show_on_memorial)}
                      onTogglePublic={() => toggleMemoryPublic(memory)}
                      onDelete={() => deleteMemory(memory)}
                    />
                  </div>

                  <div className="memoryGalleryInfo">
                    <p className="memoryProfileName">{person.full_name}</p>
                    <h2>{memory.memory_note || memory.title || memory.file_name}</h2>

                    <div className="buttonRow memoryCardDetailRow">
                      <Link href={`/app/memories/${memory.id}`} className="appButton secondary">
                        {t.viewDetails}
                      </Link>
                    </div>

                    <div className="memoryGalleryMeta">
                      <span>{memory.file_name}</span>
                      <span>
                        {t.saved}: {formatCreatedDate(memory.created_at)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}