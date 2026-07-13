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
    noDescription: "Private memory album",
  },
  es: {
    label: "Álbum",
    loading: "Cargando álbum...",
    notFound: "Álbum no encontrado",
    notFoundText: "Este álbum puede no existir o quizá no tienes acceso.",
    back: "Volver a álbumes",
    edit: "Editar álbum",
    uploadMemory: "Subir recuerdo",
    linkedTo: "Conectado con",
    general: "Álbum familiar general",
    private: "Privado",
    public: "Público",
    memories: "Recuerdos",
    emptyTitle: "Todavía no hay recuerdos en este álbum",
    emptyText: "Agrega fotos, grabaciones de voz, videos, historias o recuerdos especiales para comenzar este álbum.",
    openMemory: "Abrir recuerdo",
    removeMemory: "Quitar",
    removeConfirm: "¿Quitar este recuerdo del álbum? El recuerdo original permanecerá en tu biblioteca.",
    removed: "Recuerdo quitado del álbum.",
    saved: "Guardado",
    noDescription: "Álbum privado de recuerdos",
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
      <section className="mobileScreenStack mobileAlbumsPolish">
        <section className="mobileAlbumHeroCard">
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.loading}</h1>
        </section>
      </section>
    );
  }

  if (!collection) {
    return (
      <section className="mobileScreenStack mobileAlbumsPolish">
        <section className="mobileAlbumHeroCard">
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.notFound}</h1>
          <p className="mobileAlbumSubtitle">{t.notFoundText}</p>

          <Link href="/mobile/collections" className="mobileAlbumPrimaryBtn">
            {t.back}
          </Link>
        </section>
      </section>
    );
  }

  const lovedOneName = collection.loved_ones?.full_name || t.general;

  return (
    <section className="mobileScreenStack mobileAlbumsPolish">
      <section className="mobileAlbumHeroCard">
        <div className="mobileAlbumHeroTop">
          <p className="mobileCapsLabel">{t.label}</p>

          <span className={collection.is_public ? "mobileAlbumBadge isPublic" : "mobileAlbumBadge isPrivate"}>
            {collection.is_public ? t.public : t.private}
          </span>
        </div>

        <div className="mobileAlbumStack">
          <h1>{collection.title}</h1>

          <p className="mobileAlbumSubtitle">
            {t.linkedTo} {lovedOneName}
          </p>

          <p className="mobileAlbumHelpText">
            {collection.description || t.noDescription}
          </p>
        </div>

        <div className="mobileAlbumActionRow">
          <Link href={`/mobile/collections/${collection.id}/edit`} className="mobileAlbumSecondaryBtn">
            <Pencil size={16} />
            {t.edit}
          </Link>

          <Link href={`/mobile/upload?collectionId=${collection.id}`} className="mobileAlbumPrimaryBtn">
            <Plus size={16} />
            {t.uploadMemory}
          </Link>

          <Link href="/mobile/collections" className="mobileAlbumGhostBtn">
            {t.back}
          </Link>
        </div>
      </section>

      {message && <p className="mobileFormMessage">{message}</p>}

      <section className="mobileAlbumPanel">
        <div className="mobileAlbumSectionTitle">
          <h2>{t.memories}</h2>
          <span className="mobileAlbumSectionHint">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="mobileAlbumEmptyCard">
            <FolderHeart size={26} className="mobileAlbumMemoryEmptyIcon" />
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyText}</p>

            <Link href={`/mobile/upload?collectionId=${collection.id}`} className="mobileAlbumPrimaryBtn">
              <Plus size={17} />
              {t.uploadMemory}
            </Link>
          </div>
        ) : (
          <div className="mobileAlbumMemoryList">
            {items.map((item) => {
              const memory = item.media_assets;
              if (!memory) return null;

              const kind = getFileKind(memory.file_name, memory.file_type);
              const url = signedUrls[memory.id];

              return (
                <article className="mobileAlbumMemoryCard" key={item.id}>
                  {kind === "image" && url && (
                    <img src={url} alt={memory.file_name || "Memory"} className="mobileMemoryPreviewImage" />
                  )}

                  {kind === "audio" && url && <audio controls src={url} />}

                  {kind === "video" && url && (
                    <video controls src={url} className="mobileMemoryPreviewVideo" />
                  )}

                  <h3 className="mobileAlbumMemoryCardTitle">
                    {memory.memory_note || memory.title || memory.file_name || "Memory"}
                  </h3>

                  <p className="mobileAlbumMemoryCardMeta">
                    {t.saved}: {formatDate(memory.created_at)}
                  </p>

                  <div className="mobileAlbumActionRow compact">
                    <Link href={`/mobile/memories/${memory.id}`} className="mobileAlbumSecondaryBtn">
                      {t.openMemory}
                    </Link>

                    <button
                      type="button"
                      className="mobileAlbumGhostBtn"
                      onClick={() => removeMemoryFromCollection(item.id)}
                    >
                      {t.removeMemory}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}