"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { useAppLanguage } from "../../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Memory Detail",
    loading: "Loading memory...",
    notFound: "Memory not found",
    notFoundText: "This memory may not exist or you may not have access to it.",
    backLibrary: "Back to library",
    backProfile: "Back to profile",
    openFile: "Open file",
    share: "Share",
    makePublic: "Make public",
    makePrivate: "Make private",
    delete: "Delete memory",
    editMemory: "Edit memory",
    addToAlbum: "Add to album",
    albumsTitle: "This memory is in",
    noAlbums: "This memory is not in any albums yet.",
    openAlbum: "Open album",
    deleteConfirm: "Delete this memory? This cannot be undone.",
    deleted: "Memory deleted.",
    addedPublic: "Memory is now public on the memorial page.",
    removedPublic: "Memory is now private.",
    publicStatus: "Public on memorial",
    privateStatus: "Private",
    belongsTo: "Belongs to",
    fileName: "File name",
    memoryType: "Memory type",
    saved: "Saved",
    note: "Memory note",
    noNote: "No note has been added for this memory yet.",
    privacyTitle: "Privacy control",
    privacyText:
      "Private memories stay inside your vault. Public memories can appear on the loved one's memorial or living legacy page.",
    unknownProfile: "Unassigned memory",
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
    eyebrow: "Detalle del recuerdo",
    loading: "Cargando recuerdo...",
    notFound: "Recuerdo no encontrado",
    notFoundText: "Este recuerdo puede no existir o quizá no tienes acceso.",
    backLibrary: "Volver a biblioteca",
    backProfile: "Volver al perfil",
    openFile: "Abrir archivo",
    share: "Compartir",
    makePublic: "Hacer público",
    makePrivate: "Hacer privado",
    delete: "Eliminar recuerdo",
    editMemory: "Editar recuerdo",
    addToAlbum: "Agregar a álbum",
    albumsTitle: "Este recuerdo está en",
    noAlbums: "Este recuerdo todavía no está en ningún álbum.",
    openAlbum: "Abrir álbum",
    deleteConfirm: "¿Eliminar este recuerdo? Esta acción no se puede deshacer.",
    deleted: "Recuerdo eliminado.",
    addedPublic: "El recuerdo ahora es público en la página memorial.",
    removedPublic: "El recuerdo ahora es privado.",
    publicStatus: "Público en memorial",
    privateStatus: "Privado",
    belongsTo: "Pertenece a",
    fileName: "Nombre del archivo",
    memoryType: "Tipo de recuerdo",
    saved: "Guardado",
    note: "Nota del recuerdo",
    noNote: "Todavía no se ha agregado una nota para este recuerdo.",
    privacyTitle: "Control de privacidad",
    privacyText:
      "Los recuerdos privados permanecen dentro de tu bóveda. Los recuerdos públicos pueden aparecer en la página memorial o legado en vida del ser querido.",
    unknownProfile: "Recuerdo sin perfil",
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

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const language = useAppLanguage();
  const t = copy[language];

  const [memory, setMemory] = useState(null);
  const [profile, setProfile] = useState(null);
  const [signedUrl, setSignedUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    async function loadMemory() {
      const { data: memoryData, error: memoryError } = await supabase
        .from("media_assets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (memoryError || !memoryData) {
        setLoading(false);
        return;
      }

      setMemory(memoryData);

      if (memoryData.loved_one_id) {
        const { data: profileData } = await supabase
          .from("loved_ones")
          .select("id, full_name")
          .eq("id", memoryData.loved_one_id)
          .maybeSingle();

        setProfile(profileData || null);
      }

      const { data: signedData } = await supabase.storage
        .from("family-media")
        .createSignedUrl(memoryData.file_path, 60 * 10);

      if (signedData?.signedUrl) {
        setSignedUrl(signedData.signedUrl);
      }

      setLoading(false);
    }

    loadMemory();
  }, [id]);

  function getFileKind(fileName, fileType) {
    const type = fileType || "";
    const lower = fileName?.toLowerCase() || "";

    if (type.startsWith("image/") || lower.match(/\.(jpg|jpeg|png|webp)$/)) return "image";
    if (type.startsWith("audio/") || lower.match(/\.(mp3|wav|webm|mpeg)$/)) return "audio";
    if (type.startsWith("video/") || lower.match(/\.(mp4|mov|webm|quicktime)$/)) return "video";

    return "file";
  }

  function formatMemoryType(type) {
    return t.memoryTypes[type] || (language === "es" ? "Recuerdo" : "Memory");
  }

  function formatDate(value) {
    if (!value) return "";

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  async function handleShare() {
    if (!signedUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: memory?.memory_note || memory?.file_name || "VozEterna memory",
          text: language === "es" ? "Recuerdo de VozEterna" : "VozEterna memory",
          url: signedUrl,
        });
      } else {
        await navigator.clipboard.writeText(signedUrl);
      }
    } catch {
      // User cancelled sharing or browser blocked it.
    }
  }

  async function togglePublic() {
    if (!memory) return;

    const nextValue = !memory.show_on_memorial;

    const { error } = await supabase
      .from("media_assets")
      .update({ show_on_memorial: nextValue })
      .eq("id", memory.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMemory({ ...memory, show_on_memorial: nextValue });
    setMessage(nextValue ? t.addedPublic : t.removedPublic);
  }

  async function deleteMemory() {
    if (!memory) return;

    const confirmed = window.confirm(t.deleteConfirm);
    if (!confirmed) return;

    await supabase.storage.from("family-media").remove([memory.file_path]);

    const { error } = await supabase.from("media_assets").delete().eq("id", memory.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(t.deleted);
    router.push("/app/library");
  }

  if (loading) {
    return (
      <main className="appShell memoryDetailShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.loading}</h1>
        </section>
      </main>
    );
  }

  if (!memory) {
    return (
      <main className="appShell memoryDetailShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.notFound}</h1>
          <p>{t.notFoundText}</p>

          <Link href="/app/library" className="appButton">
            {t.backLibrary}
          </Link>
        </section>
      </main>
    );
  }

  const kind = getFileKind(memory.file_name, memory.file_type);

  return (
    <main className="appShell memoryDetailShell">
      <section className="memoryDetailHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{memory.memory_note || memory.title || formatMemoryType(memory.memory_type)}</h1>
          <p>{profile?.full_name || t.unknownProfile}</p>

          <div className="buttonRow">
            <Link href="/app/library" className="appButton secondary">
              {t.backLibrary}
            </Link>

            {profile?.id && (
              <Link href={`/app/loved-ones/${profile.id}`} className="appButton ghost">
                {t.backProfile}
              </Link>
            )}
          </div>
        </div>

        <aside className="memoryDetailPrivacyCard">
          <span className={memory.show_on_memorial ? "publicStatus" : "privateStatus"}>
            {memory.show_on_memorial ? t.publicStatus : t.privateStatus}
          </span>

          <h2>{t.privacyTitle}</h2>
          <p>{t.privacyText}</p>

          <button type="button" className="appButton" onClick={togglePublic}>
            {memory.show_on_memorial ? t.makePrivate : t.makePublic}
          </button>
        </aside>
      </section>

      {message && <div className="successBox memoryDetailMessage">{message}</div>}

      <section className="memoryDetailGrid">
        <article className="memoryDetailPreviewCard">
          {kind === "image" && signedUrl && <img src={signedUrl} alt={memory.file_name} />}

          {kind === "audio" && signedUrl && (
            <div className="memoryDetailAudio">
              <span>♪</span>
              <audio controls src={signedUrl} />
            </div>
          )}

          {kind === "video" && signedUrl && <video controls src={signedUrl} />}

          {kind === "file" && (
            <div className="memoryDetailFile">
              <span>VE</span>
              <p>{memory.file_name}</p>
            </div>
          )}
        </article>

        <aside className="memoryDetailInfoCard">
          <p className="appEyebrow">{t.note}</p>
          <h2>{memory.memory_note || t.noNote}</h2>

          <div className="memoryDetailMeta">
            <p>
              <strong>{t.belongsTo}:</strong> {profile?.full_name || t.unknownProfile}
            </p>
            <p>
              <strong>{t.memoryType}:</strong> {formatMemoryType(memory.memory_type)}
            </p>
            <p>
              <strong>{t.fileName}:</strong> {memory.file_name}
            </p>
            <p>
              <strong>{t.saved}:</strong> {formatDate(memory.created_at)}
            </p>
          </div>

          <div className="buttonRow">
            {signedUrl && (
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="appButton">
                {t.openFile}
              </a>
            )}

            {signedUrl && (
              <button type="button" className="appButton secondary" onClick={handleShare}>
                {t.share}
              </button>
            )}

            <Link href={`/app/memories/${memory.id}/edit`} className="appButton ghost">
              {t.editMemory}
            </Link>

            <Link href={`/app/memories/${memory.id}/add-to-album`} className="appButton ghost">
              {t.addToAlbum}
            </Link>

            <button type="button" className="appButton dangerButton" onClick={deleteMemory}>
              {t.delete}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}