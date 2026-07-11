"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import { useAppLanguage } from "../../../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Add Memories",
    loading: "Loading memories...",
    notFound: "Collection not found",
    title: "Add memories to collection",
    subtitle:
      "Choose existing memories from your private vault and add them to this album.",
    back: "Back to collection",
    addSelected: "Add selected memories",
    adding: "Adding...",
    emptyTitle: "No available memories",
    emptyText:
      "All memories may already be in this collection, or you have not uploaded memories yet.",
    selected: "selected",
    saved: "Saved",
    added: "Memories added to collection.",
    error: "Something went wrong. Please try again.",
    private: "Private",
    public: "Public on memorial",
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
    eyebrow: "Agregar recuerdos",
    loading: "Cargando recuerdos...",
    notFound: "Álbum no encontrado",
    title: "Agregar recuerdos al álbum",
    subtitle:
      "Elige recuerdos existentes de tu bóveda privada y agrégalos a este álbum.",
    back: "Volver al álbum",
    addSelected: "Agregar recuerdos seleccionados",
    adding: "Agregando...",
    emptyTitle: "No hay recuerdos disponibles",
    emptyText:
      "Puede que todos los recuerdos ya estén en este álbum, o todavía no has subido recuerdos.",
    selected: "seleccionados",
    saved: "Guardado",
    added: "Recuerdos agregados al álbum.",
    error: "Algo salió mal. Inténtalo de nuevo.",
    private: "Privado",
    public: "Público en memorial",
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

export default function AddMemoriesToCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const language = useAppLanguage();
  const t = copy[language] || copy.en;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collection, setCollection] = useState(null);
  const [memories, setMemories] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: collectionData, error: collectionError } = await supabase
        .from("memory_collections")
        .select("id, title, loved_one_id")
        .eq("id", id)
        .maybeSingle();

      if (collectionError || !collectionData) {
        setLoading(false);
        return;
      }

      setCollection(collectionData);

      const { data: existingItems } = await supabase
        .from("memory_collection_items")
        .select("memory_id")
        .eq("collection_id", id);

      const existingMemoryIds = new Set((existingItems || []).map((item) => item.memory_id));

      let query = supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (collectionData.loved_one_id) {
        query = query.eq("loved_one_id", collectionData.loved_one_id);
      }

      const { data: memoryData } = await query;

      const availableMemories = (memoryData || []).filter(
        (memory) => !existingMemoryIds.has(memory.id)
      );

      setMemories(availableMemories);

      const urlMap = {};

      for (const memory of availableMemories) {
        if (!memory.file_path) continue;

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

    loadData();
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

  function toggleSelected(memoryId) {
    setSelectedIds((current) =>
      current.includes(memoryId)
        ? current.filter((idValue) => idValue !== memoryId)
        : [...current, memoryId]
    );
  }

  async function addSelectedMemories() {
    if (selectedIds.length === 0) return;

    setSaving(true);
    setMessage("");

    const rows = selectedIds.map((memoryId, index) => ({
      collection_id: id,
      memory_id: memoryId,
      sort_order: index,
    }));

    const { error } = await supabase.from("memory_collection_items").insert(rows);

    setSaving(false);

    if (error) {
      setMessage(error.message || t.error);
      return;
    }

    setMessage(t.added);

    setTimeout(() => {
      router.push(`/app/collections/${id}`);
    }, 650);
  }

  if (loading) {
    return (
      <main className="appShell addCollectionMemoriesShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.loading}</h1>
        </section>
      </main>
    );
  }

  if (!collection) {
    return (
      <main className="appShell addCollectionMemoriesShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.notFound}</h1>

          <Link href="/app/collections" className="appButton">
            {t.back}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell addCollectionMemoriesShell">
      <section className="collectionDetailHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>

          <div className="collectionDetailMeta">
            <span>{collection.title}</span>
            <span>
              {selectedIds.length} {t.selected}
            </span>
          </div>
        </div>

        <aside className="collectionDetailActions">
          <Link href={`/app/collections/${collection.id}`} className="appButton secondary">
            {t.back}
          </Link>

          <button
            type="button"
            className="appButton"
            onClick={addSelectedMemories}
            disabled={saving || selectedIds.length === 0}
          >
            {saving ? t.adding : t.addSelected}
          </button>
        </aside>
      </section>

      {message && <div className="successBox addMemoriesMessage">{message}</div>}

      {memories.length === 0 ? (
        <section className="emptyStateCard collectionsEmpty">
          <span>VE</span>
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>

          <Link href={`/app/collections/${collection.id}`} className="appButton">
            {t.back}
          </Link>
        </section>
      ) : (
        <section className="memoryGalleryGrid addMemoriesGrid">
          {memories.map((memory) => {
            const kind = getFileKind(memory.file_name, memory.file_type);
            const url = signedUrls[memory.id];
            const selected = selectedIds.includes(memory.id);

            return (
              <article
                className={selected ? "memoryGalleryCard selectableMemoryCard selected" : "memoryGalleryCard selectableMemoryCard"}
                key={memory.id}
              >
                <button
                  type="button"
                  className="selectMemoryButton"
                  onClick={() => toggleSelected(memory.id)}
                  aria-label={selected ? "Remove memory" : "Select memory"}
                >
                  {selected ? "✓" : "+"}
                </button>

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