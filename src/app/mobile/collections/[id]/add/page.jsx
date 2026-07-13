"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, FolderHeart, Library } from "lucide-react";
import { supabase } from "../../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Add memories",
    loading: "Loading memories...",
    notFound: "Album not found",
    title: "Add from library",
    subtitle: "Choose existing memories from your library and add them to this album.",
    back: "Back to album",
    addSelected: "Add selected",
    adding: "Adding...",
    emptyTitle: "No available memories",
    emptyText: "You do not have library memories available to add, or they are already in this album.",
    selected: "selected",
    added: "Memories added to album.",
    error: "Something went wrong. Please try again.",
    saved: "Saved",
  },
  es: {
    label: "Agregar recuerdos",
    loading: "Cargando recuerdos...",
    notFound: "Álbum no encontrado",
    title: "Agregar de biblioteca",
    subtitle: "Elige recuerdos existentes de tu biblioteca y agrégalos a este álbum.",
    back: "Volver al álbum",
    addSelected: "Agregar seleccionados",
    adding: "Agregando...",
    emptyTitle: "No hay recuerdos disponibles",
    emptyText: "No tienes recuerdos disponibles para agregar, o ya están en este álbum.",
    selected: "seleccionados",
    added: "Recuerdos agregados al álbum.",
    error: "Algo salió mal. Inténtalo de nuevo.",
    saved: "Guardado",
  },
};

export default function MobileAddMemoriesToCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collection, setCollection] = useState(null);
  const [memories, setMemories] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState("");

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data: collectionData, error: collectionError } = await supabase
        .from("memory_collections")
        .select("id, title")
        .eq("id", id)
        .maybeSingle();

      if (collectionError || !collectionData) {
        setCollection(null);
        setLoading(false);
        return;
      }

      setCollection(collectionData);

      const { data: existingItems } = await supabase
        .from("memory_collection_items")
        .select("memory_id")
        .eq("collection_id", id);

      const existingMemoryIds = new Set((existingItems || []).map((item) => item.memory_id));

      const { data: memoryData } = await supabase
        .from("memories")
        .select("id, title, body, type, media_path, media_mime_type, created_at")
        .order("created_at", { ascending: false });

      const availableMemories = (memoryData || []).filter(
        (memory) => !existingMemoryIds.has(memory.id)
      );

      setMemories(availableMemories);

      const urlMap = {};

      for (const memory of availableMemories) {
        if (!memory.media_path) continue;

        const { data: signedData } = await supabase.storage
          .from("family-media")
          .createSignedUrl(memory.media_path, 60 * 10);

        if (signedData?.signedUrl) {
          urlMap[memory.id] = signedData.signedUrl;
        }
      }

      setSignedUrls(urlMap);
      setLoading(false);
    }

    if (id) {
      loadData();
    }
  }, [id]);

  function toggleSelected(memoryId) {
    setSelectedIds((current) =>
      current.includes(memoryId)
        ? current.filter((idValue) => idValue !== memoryId)
        : [...current, memoryId]
    );
  }

  function formatDate(value) {
    if (!value) return "";

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(value));
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
      router.push(`/mobile/collections/${id}`);
    }, 700);
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

          <Link href="/mobile/collections" className="mobileAlbumPrimaryBtn">
            {t.back}
          </Link>
        </section>
      </section>
    );
  }

  return (
    <section className="mobileScreenStack mobileAlbumsPolish">
      <section className="mobileAlbumHeroCard">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p className="mobileAlbumSubtitle">{collection.title}</p>
        <p className="mobileAlbumHelpText">{t.subtitle}</p>

        <div className="mobileAlbumActionRow">
          <Link href={`/mobile/collections/${id}`} className="mobileAlbumGhostBtn">
            {t.back}
          </Link>

          <button
            type="button"
            className="mobileAlbumPrimaryBtn"
            onClick={addSelectedMemories}
            disabled={saving || selectedIds.length === 0}
          >
            {saving ? t.adding : `${t.addSelected} (${selectedIds.length})`}
          </button>
        </div>
      </section>

      {message && (
        <p className="mobileFormMessage">
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </p>
      )}

      <section className="mobileAlbumPanel">
        {memories.length === 0 ? (
          <div className="mobileAlbumEmptyCard">
            <Library size={26} className="mobileAlbumMemoryEmptyIcon" />
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyText}</p>
          </div>
        ) : (
          <div className="mobileAlbumMemoryList">
            {memories.map((memory) => {
              const selected = selectedIds.includes(memory.id);
              const url = signedUrls[memory.id];

              return (
                <button
                  type="button"
                  key={memory.id}
                  className={selected ? "mobileAlbumMemoryCard mobileLibraryMemorySelect selected" : "mobileAlbumMemoryCard mobileLibraryMemorySelect"}
                  onClick={() => toggleSelected(memory.id)}
                >
                  {url && memory.media_mime_type?.startsWith("image/") && (
                    <img src={url} alt={memory.title || "Memory"} className="mobileMemoryPreviewImage" />
                  )}

                  <span className="mobileAlbumSelectCheck">
                    {selected ? "✓" : "+"}
                  </span>

                  <h3 className="mobileAlbumMemoryCardTitle">
                    {memory.body || memory.title || "Memory"}
                  </h3>

                  <p className="mobileAlbumMemoryCardMeta">
                    {t.saved}: {formatDate(memory.created_at)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}