"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemoryActions from "../../../components/app/MemoryActions";
import { supabase } from "../../../lib/supabaseClient";
import { useAppLanguage } from "../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Memory Library",
    title: "Your Memory Gallery",
    subtitle:
      "A private family archive for photos, voices, videos, keepsakes, and stories connected to the people you love.",
    signInTitle: "Please sign in",
    signInText: "You need to sign in before viewing your private memory library.",
    signIn: "Sign in",
    back: "Back to dashboard",
    upload: "Upload memory",
    record: "Record memory",
    emptyTitle: "No memories yet",
    emptyText: "Upload or record your first memory to begin building your family legacy vault.",
    addedPublic: "Memory added to public memorial page.",
    removedPublic: "Memory hidden from public memorial page.",
    deleted: "Memory deleted.",
    viewDetails: "View details",
    deleteConfirm: "Delete this memory? This cannot be undone.",
    belongsTo: "Profile",
    noProfile: "No profile assigned",
    privateBadge: "Private",
    publicBadge: "Public Memorial",
    saved: "Saved",
    unknownDate: "Unknown date",
    trustTitle: "Private by default",
    trustText:
      "Memories stay private unless you choose to show them on a public memorial page.",
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
    eyebrow: "Biblioteca de recuerdos",
    title: "Tu galería de recuerdos",
    subtitle:
      "Un archivo familiar privado para fotos, voces, videos, recuerdos especiales e historias conectadas a las personas que amas.",
    signInTitle: "Por favor inicia sesión",
    signInText: "Necesitas iniciar sesión antes de ver tu biblioteca privada de recuerdos.",
    signIn: "Iniciar sesión",
    back: "Volver al inicio",
    upload: "Subir recuerdo",
    record: "Grabar recuerdo",
    emptyTitle: "Todavía no hay recuerdos",
    emptyText: "Sube o graba tu primer recuerdo para comenzar a construir tu bóveda de legado familiar.",
    addedPublic: "Recuerdo agregado a la página memorial pública.",
    removedPublic: "Recuerdo ocultado de la página memorial pública.",
    deleted: "Recuerdo eliminado.",
    viewDetails: "Ver detalles",
    deleteConfirm: "¿Eliminar este recuerdo? Esta acción no se puede deshacer.",
    belongsTo: "Perfil",
    noProfile: "Sin perfil asignado",
    privateBadge: "Privado",
    publicBadge: "Público en memorial",
    saved: "Guardado",
    unknownDate: "Fecha desconocida",
    trustTitle: "Privado por defecto",
    trustText:
      "Los recuerdos permanecen privados a menos que decidas mostrarlos en una página memorial pública.",
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

export default function LibraryPage() {
  const language = useAppLanguage();
  const t = copy[language];

  const [user, setUser] = useState(null);
  const [memories, setMemories] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLibrary() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const [{ data: memoryData }, { data: profileData }] = await Promise.all([
        supabase
          .from("media_assets")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("loved_ones").select("id, full_name"),
      ]);

      const loadedMemories = memoryData || [];
      const loadedProfiles = profileData || [];

      const profileMap = {};
      loadedProfiles.forEach((profile) => {
        profileMap[profile.id] = profile.full_name;
      });

      setProfilesById(profileMap);
      setMemories(loadedMemories);

      const urlMap = {};

      for (const memory of loadedMemories) {
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

    loadLibrary();
  }, []);

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

  function formatDate(value) {
    if (!value) return t.unknownDate;

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(value));
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
            <Link href="/app" className="appButton secondary">
              {t.back}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell libraryGalleryShell">
      <section className="libraryGalleryHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>

          <div className="buttonRow">
            <Link href="/app/upload" className="appButton">
              {t.upload}
            </Link>
            <Link href="/app/record" className="appButton secondary">
              {t.record}
            </Link>
          </div>
        </div>

        <aside className="libraryTrustCard">
          <span>VE</span>
          <h2>{t.trustTitle}</h2>
          <p>{t.trustText}</p>
        </aside>
      </section>

      {message && <div className="successBox libraryMessageBox">{message}</div>}

      {memories.length === 0 ? (
        <section className="emptyState">
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>

          <div className="buttonRow">
            <Link href="/app/upload" className="appButton">
              {t.upload}
            </Link>
            <Link href="/app/record" className="appButton secondary">
              {t.record}
            </Link>
          </div>
        </section>
      ) : (
        <section className="memoryGalleryGrid">
          {memories.map((memory) => {
            const kind = getFileKind(memory.file_name, memory.file_type);
            const url = signedUrls[memory.id];
            const profileName = profilesById[memory.loved_one_id] || t.noProfile;

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
                  <p className="memoryProfileName">{profileName}</p>
                  <h2>{memory.memory_note || memory.title || memory.file_name}</h2>

                  <div className="buttonRow memoryCardDetailRow">
                      <Link href={`/app/memories/${memory.id}`} className="appButton secondary">
                        {t.viewDetails}
                      </Link>
                    </div>

                    <div className="memoryGalleryMeta">
                    <span>{memory.file_name}</span>
                    <span>
                      {t.saved}: {formatDate(memory.created_at)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}