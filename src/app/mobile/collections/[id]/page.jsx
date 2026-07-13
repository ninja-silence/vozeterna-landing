"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FolderHeart, Pencil, Plus } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Album",
    loading: "Loading album...",
    notFound: "Album not found",
    notFoundText: "This album may not exist or you may not have access to it.",
    back: "Back to albums",
    edit: "Edit album",
    addMemories: "Add memories",
    uploadMemory: "Upload memory",
    linkedTo: "Linked to",
    general: "General family album",
    private: "Private",
    public: "Public",
    memories: "Memories",
    emptyTitle: "No memories in this album yet",
    emptyText: "Add photos, voice recordings, videos, stories, or keepsakes to start building this album.",
    openMemory: "Open memory",
    removeMemory: "Remove",
    removeConfirm: "Remove this memory from the album? The original memory will stay in your library.",
    removed: "Memory removed from album.",
    saved: "Saved",
  },
  es: {
    label: "Ãlbum",
    loading: "Cargando Ã¡lbum...",
    notFound: "Ãlbum no encontrado",
    notFoundText: "Este Ã¡lbum puede no existir o quizÃ¡ no tienes acceso.",
    back: "Volver a Ã¡lbumes",
    edit: "Editar Ã¡lbum",
    addMemories: "Agregar recuerdos",
    uploadMemory: "Subir recuerdo",
    linkedTo: "Conectado con",
    general: "Ãlbum familiar general",
    private: "Privado",
    public: "PÃºblico",
    memories: "Recuerdos",
    emptyTitle: "TodavÃ­a no hay recuerdos en este Ã¡lbum",
    emptyText: "Agrega fotos, grabaciones de voz, videos, historias o recuerdos especiales para comenzar este Ã¡lbum.",
    openMemory: "Abrir recuerdo",
    removeMemory: "Quitar",
    removeConfirm: "Â¿Quitar este recuerdo del Ã¡lbum? El recuerdo original permanecerÃ¡ en tu biblioteca.",
    removed: "Recuerdo quitado del Ã¡lbum.",
    saved: "Guardado",
  },
};

export default function MobileCollectionDetailPage() {
  const params = useParams();
  const id = params.id;

  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState(null);
  const [items, setItems] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [message, setMessage] = useState("");

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());
  }, []);

  useEffect(() => {
    async function loadCollection() {
      setLoading(true);

      const { data: collectionData, error: collectionError } = await supabase
        .from("memory_collections")
        .select(`
          *,
          loved_ones (
            id,
            full_name
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (collectionError || !collectionData) {
        setCollection(null);
        setLoading(false);
        return;
      }

      setCollection(collectionData);

      const { data: itemData } = await supabase
        .from("memory_collection_items")
        .select(`
          id,
          sort_order,
          created_at,
          media_assets (
            *
          )
        `)
        .eq("collection_id", id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      const loadedItems = itemData || [];
      setItems(loadedItems);

      const urlMap = {};

      for (const item of loadedItems) {
        const memory = item.media_assets;

        if (!memory?.file_path) continue;

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

    if (id) {
      loadCollection();
    }
  }, [id]);

  function getFileKind(fileName, fileType) {
    const type = fileType || "";
    const lower = fileName?.toLowerCase() || "";

    if (type.startsWith("image/") || lower.match(/\.(jpg|jpeg|png|webp)$/)) return "image";
    if (type.startsWith("audio/") || lower.match(/\.(mp3|wav|webm|mpeg)$/)) return "audio";
    if (type.startsWith("video/") || lower.match(/\.(mp4|mov|webm|quicktime)$/)) return "video";

    return "file";
  }

  function formatDate(value) {
    if (!value) return "";

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(value));
  }

  async function removeMemoryFromCollection(itemId) {
    const confirmed = window.confirm(t.removeConfirm);
    if (!confirmed) return;

    const { error } = await supabase
      .from("memory_collection_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== itemId));
    setMessage(t.removed);
  }

  if (loading) {
    return (
      <section className="mobileScreenStack">
        <div className="mobileScreenHero">
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.loading}</h1>
        </div>
      </section>
    );
  }

  if (!collection) {
    return (
      <section className="mobileScreenStack">
        <div className="mobileScreenHero">
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.notFound}</h1>
          <p>{t.notFoundText}</p>

          <Link href="/mobile/collections" className="mobileRecorderPrimary">
            {t.back}
          </Link>
        </div>
      </section>
    );
  }

  const lovedOneName = collection.loved_ones?.full_name || t.general;

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{collection.title}</h1>
        <p>{collection.description || lovedOneName}</p>

        <div className="mobileMetaRow">
          <span>{t.linkedTo}: {lovedOneName}</span>
          <span className={collection.is_public ? "mobileStatusPill public" : "mobileStatusPill"}>
            {collection.is_public ? t.public : t.private}
          </span>
        </div>

        <div className="mobileActionRow">
          <Link href="/mobile/collections" className="mobileSecondaryButton">
            {t.back}
          </Link>

          <Link href={`/mobile/collections/${collection.id}/edit`} className="mobileSecondaryButton">
            <Pencil size={16} />
            {t.edit}
          </Link>

          <Link href={`/mobile/upload?collectionId=${collection.id}`} className="mobileRecorderPrimary">
            <Plus size={16} />
            {t.uploadMemory}
          </Link>
        </div>
      </div>

      {message && <p className="mobileFormMessage">{message}</p>}

      <section className="mobileCardList">
        <p className="mobileCapsLabel">{t.memories}</p>

        {items.length === 0 ? (
          <div className="mobileEmptyCard">
            <FolderHeart size={24} />
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>
            <Link href={`/mobile/upload?collectionId=${collection.id}`} className="mobileRecorderPrimary">
              <Plus size={17} />
              {t.uploadMemory}
            </Link>
          </div>
        ) : (
          items.map((item) => {
            const memory = item.media_assets;
            if (!memory) return null;

            const kind = getFileKind(memory.file_name, memory.file_type);
            const url = signedUrls[memory.id];

            return (
              <article className="mobileListCard" key={item.id}>
                {kind === "image" && url && <img src={url} alt={memory.file_name || "Memory"} className="mobileMemoryPreviewImage" />}
                {kind === "audio" && url && <audio controls src={url} />}
                {kind === "video" && url && <video controls src={url} className="mobileMemoryPreviewVideo" />}

                <strong>{memory.memory_note || memory.title || memory.file_name || "Memory"}</strong>

                <small>
                  {t.saved}: {formatDate(memory.created_at)}
                </small>

                <div className="mobileActionRow">
                  <Link href={`/app/memories/${memory.id}`} className="mobileSecondaryButton">
                    {t.openMemory}
                  </Link>

                  <button type="button" className="mobileSecondaryButton" onClick={() => removeMemoryFromCollection(item.id)}>
                    {t.removeMemory}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}