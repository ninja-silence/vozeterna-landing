"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { useAppLanguage } from "../../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Collection",
    loading: "Loading collection...",
    notFound: "Collection not found",
    notFoundText: "This collection may not exist or you may not have access to it.",
    back: "Back to collections",
    edit: "Edit collection",
    addMemories: "Add memories",
    linkedTo: "Linked to",
    general: "General family collection",
    private: "Private",
    public: "Public",
    memories: "Collection memories",
    emptyTitle: "No memories in this collection yet",
    emptyText:
      "Add photos, voice recordings, videos, stories, or keepsakes to start building this album.",
    openMemory: "Open memory",
    removeMemory: "Remove from collection",
    removeConfirm: "Remove this memory from the collection? The original memory will stay in your library.",
    removed: "Memory removed from collection.",
    saved: "Saved",
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
    eyebrow: "Álbum",
    loading: "Cargando álbum...",
    notFound: "Álbum no encontrado",
    notFoundText: "Este álbum puede no existir o quizá no tienes acceso.",
    back: "Volver a álbumes",
    edit: "Editar álbum",
    addMemories: "Agregar recuerdos",
    linkedTo: "Conectado con",
    general: "Álbum familiar general",
    private: "Privado",
    public: "Público",
    memories: "Recuerdos del álbum",
    emptyTitle: "Todavía no hay recuerdos en este álbum",
    emptyText:
      "Agrega fotos, grabaciones de voz, videos, historias o recuerdos especiales para comenzar este álbum.",
    openMemory: "Abrir recuerdo",
    removeMemory: "Quitar del álbum",
    removeConfirm: "¿Quitar este recuerdo del álbum? El recuerdo original permanecerá en tu biblioteca.",
    removed: "Recuerdo quitado del álbum.",
    saved: "Guardado",
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

export default function CollectionDetailPage() {
  const params = useParams();
  const id = params.id;

  const language = useAppLanguage();
  const t = copy[language] || copy.en;

  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState(null);
  const [items, setItems] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCollection() {
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

    loadCollection();
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
      <main className="appShell collectionDetailShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.loading}</h1>
        </section>
      </main>
    );
  }

  if (!collection) {
    return (
      <main className="appShell collectionDetailShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.notFound}</h1>
          <p>{t.notFoundText}</p>

          <Link href="/app/collections" className="appButton">
            {t.back}
          </Link>
        </section>
      </main>
    );
  }

  const lovedOneName = collection.loved_ones?.full_name || t.general;

  return (
    <main className="appShell collectionDetailShell">
      <section className="collectionDetailHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{collection.title}</h1>
          <p>{collection.description || lovedOneName}</p>

          <div className="collectionDetailMeta">
            <span>
              {t.linkedTo}: {lovedOneName}
            </span>

            <span className={collection.is_public ? "publicStatus" : "privateStatus"}>
              {collection.is_public ? t.public : t.private}
            </span>
          </div>
        </div>

        <aside className="collectionDetailActions">
          <Link href="/app/collections" className="appButton secondary">
            {t.back}
          </Link>

          <Link href={`/app/collections/${collection.id}/add`} className="appButton">
            {t.addMemories}
          </Link>

          <Link href={`/app/collections/${collection.id}/edit`} className="appButton ghost">
            {t.edit}
          </Link>
        </aside>
      </section>

      {message && <div className="successBox addMemoriesMessage">{message}</div>}

      <section className="collectionMemoriesSection">
        <div className="sectionHeaderRow">
          <div>
            <p className="appEyebrow">{t.memories}</p>
            <h2>{collection.title}</h2>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="emptyStateCard collectionEmptyState">
            <span>VE</span>
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>

            <Link href={`/app/collections/${collection.id}/add`} className="appButton">
              {t.addMemories}
            </Link>
          </div>
        ) : (
          <div className="memoryGalleryGrid">
            {items.map((item) => {
              const memory = item.media_assets;
              if (!memory) return null;

              const kind = getFileKind(memory.file_name, memory.file_type);
              const url = signedUrls[memory.id];

              return (
                <article className="memoryGalleryCard" key={item.id}>
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
                        {memory.show_on_memorial ? t.public : t.private}
                      </span>
                    </div>
                  </div>

                  <div className="memoryGalleryInfo">
                    <h2>{memory.memory_note || memory.title || memory.file_name}</h2>

                    <div className="buttonRow memoryCardDetailRow">
                      <Link href={`/app/memories/${memory.id}`} className="appButton secondary">
                        {t.openMemory}
                      </Link>

                      <button
                        type="button"
                        className="appButton ghost"
                        onClick={() => removeMemoryFromCollection(item.id)}
                      >
                        {t.removeMemory}
                      </button>
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
          </div>
        )}
      </section>
    </main>
  );
}