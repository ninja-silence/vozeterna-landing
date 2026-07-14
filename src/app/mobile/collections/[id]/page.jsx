"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, FolderHeart, Library, Pencil, Plus } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { isMemoryOwner } from "../../../../lib/memoryPermissions";
import { normalizeStoragePath, warnInvalidStoragePath } from "../../../../lib/storagePaths";
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
    addFromLibrary: "Add from library",
    linkedTo: "Linked to",
    general: "General family album",
    private: "Private",
    public: "Public",
    memories: "Memories",
    emptyTitle: "No memories in this album yet",
    emptyText: "Upload a new memory or add one that already exists in your library.",
    openMemory: "Open memory",
    editMemory: "Edit memory",
    removeMemory: "Remove",
    removeConfirm: "Remove this memory from the album? The original memory will stay in your library.",
    removed: "Memory removed from album.",
    saved: "Saved",
    noDescription: "Private memory album",
  },
  es: {
    label: "Album",
    loading: "Cargando album...",
    notFound: "Album no encontrado",
    notFoundText: "Este album puede no existir o quiza no tienes acceso.",
    back: "Volver a albumes",
    edit: "Editar album",
    uploadMemory: "Subir recuerdo",
    addFromLibrary: "Agregar de biblioteca",
    linkedTo: "Conectado con",
    general: "Album familiar general",
    private: "Privado",
    public: "Publico",
    memories: "Recuerdos",
    emptyTitle: "Todavia no hay recuerdos en este album",
    emptyText: "Sube un recuerdo nuevo o agrega uno que ya existe en tu biblioteca.",
    openMemory: "Abrir recuerdo",
    editMemory: "Editar recuerdo",
    removeMemory: "Quitar",
    removeConfirm: "Quitar este recuerdo del album? El recuerdo original permanecera en tu biblioteca.",
    removed: "Recuerdo quitado del album.",
    saved: "Guardado",
    noDescription: "Album privado de recuerdos",
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
  const [currentUserId, setCurrentUserId] = useState("");

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());
  }, []);

  useEffect(() => {
    async function loadCollection() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || "");

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

      const { data: itemRows } = await supabase
        .from("memory_collection_items")
        .select("id, memory_id, sort_order, created_at")
        .eq("collection_id", id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      const rows = itemRows || [];
      const memoryIds = rows.map((item) => item.memory_id).filter(Boolean);

      let v2Memories = [];
      let legacyMemories = [];

      if (memoryIds.length > 0) {
        const [{ data: memoriesData }, { data: mediaData }] = await Promise.all([
          supabase
            .from("memories")
            .select("id, title, body, type, media_path, media_mime_type, media_size_bytes, created_by, vault_id, network_id, created_at")
            .in("id", memoryIds),
          supabase
            .from("media_assets")
            .select("*")
            .in("id", memoryIds),
        ]);

        v2Memories = memoriesData || [];
        legacyMemories = mediaData || [];
      }

      const v2ById = new Map(v2Memories.map((memory) => [memory.id, memory]));
      const legacyById = new Map(legacyMemories.map((memory) => [memory.id, memory]));

      const normalizedItems = rows
        .map((item) => {
          const v2 = v2ById.get(item.memory_id);
          const legacy = legacyById.get(item.memory_id);

          if (v2) {
            return {
              ...item,
              memory: {
                id: v2.id,
                title: v2.title,
                note: v2.body,
                type: v2.type,
                fileName: v2.title || "Memory",
                filePath: v2.media_path,
                fileType: v2.media_mime_type,
                created_by: v2.created_by,
                vault_id: v2.vault_id,
                network_id: v2.network_id,
                createdAt: v2.created_at,
              },
            };
          }

          if (legacy) {
            return {
              ...item,
              memory: {
                id: legacy.id,
                title: legacy.memory_note || legacy.title || legacy.file_name,
                note: legacy.memory_note,
                type: legacy.memory_type,
                fileName: legacy.file_name,
                filePath: legacy.file_path,
                fileType: legacy.file_type,
                createdAt: legacy.created_at,
              },
            };
          }

          return null;
        })
        .filter(Boolean);

      setItems(normalizedItems);

      const urlMap = {};

      for (const item of normalizedItems) {
        const memory = item.memory;

        const filePath = normalizeStoragePath(memory?.filePath);
        if (!filePath) {
          if (memory?.filePath) warnInvalidStoragePath("mobile album media", memory.filePath);
          continue;
        }

        const { data: signedData, error: signedError } = await supabase.storage
          .from("family-media")
          .createSignedUrl(filePath, 60 * 10);

        if (!signedError && signedData?.signedUrl) {
          urlMap[memory.id] = signedData.signedUrl;
        } else {
          warnInvalidStoragePath("mobile album media", memory.filePath);
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
          <div className="mobileAlbumCoverIcon">
            <BookOpen size={28} />
          </div>

          <h1 className="mobileAlbumWhiteTitle">{collection.title}</h1>

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

          <Link href={`/mobile/upload?albumId=${collection.id}`} className="mobileAlbumPrimaryBtn">
            <Plus size={16} />
            {t.uploadMemory}
          </Link>

          <Link href={`/mobile/collections/${collection.id}/add`} className="mobileAlbumSecondaryBtn">
            <Library size={16} />
            {t.addFromLibrary}
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

            <div className="mobileAlbumActionRow">
              <Link href={`/mobile/upload?albumId=${collection.id}`} className="mobileAlbumPrimaryBtn">
                <Plus size={17} />
                {t.uploadMemory}
              </Link>

              <Link href={`/mobile/collections/${collection.id}/add`} className="mobileAlbumSecondaryBtn">
                <Library size={17} />
                {t.addFromLibrary}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mobileAlbumMemoryList">
            {items.map((item) => {
              const memory = item.memory;
              if (!memory) return null;

              const kind = getFileKind(memory.fileName, memory.fileType);
              const url = signedUrls[memory.id];
              const canManageMemory = isMemoryOwner(memory, null, currentUserId);

              return (
                <article className="mobileAlbumMemoryCard" key={item.id}>
                  {kind === "image" && url && (
                    <img src={url} alt={memory.fileName || "Memory"} className="mobileMemoryPreviewImage" />
                  )}

                  {kind === "audio" && url && <audio controls src={url} />}

                  {kind === "video" && url && (
                    <video controls src={url} className="mobileMemoryPreviewVideo" />
                  )}

                  {(!url || kind === "file") && (
                    <div className="mobileAlbumFilePreview">
                      <FolderHeart size={22} />
                    </div>
                  )}

                  <h3 className="mobileAlbumMemoryCardTitle">
                    {memory.note || memory.title || memory.fileName || "Memory"}
                  </h3>

                  <p className="mobileAlbumMemoryCardMeta">
                    {t.saved}: {formatDate(memory.createdAt)}
                  </p>

                  <div className="mobileAlbumActionRow compact">
                    <Link href={`/mobile/memories/${memory.id}`} className="mobileAlbumSecondaryBtn">
                      {t.openMemory}
                    </Link>

                    {canManageMemory && (
                      <Link href={`/mobile/memories/${memory.id}/edit`} className="mobileAlbumSecondaryBtn">
                        {t.editMemory}
                      </Link>
                    )}

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
