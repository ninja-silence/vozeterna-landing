"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import { useAppLanguage } from "../../../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Add to Album",
    loading: "Loading albums...",
    title: "Add this memory to an album",
    subtitle:
      "Choose one or more albums where this memory should appear. The original memory will stay in your library.",
    back: "Back to memory",
    noAlbumsTitle: "No available albums",
    noAlbumsText:
      "Create an album first, then come back to add this memory.",
    createAlbum: "Create album",
    addSelected: "Add to selected albums",
    adding: "Adding...",
    alreadyAdded: "Already added",
    selected: "Selected",
    add: "Add",
    saved: "Memory added to album.",
    savedMultiple: "Memory added to albums.",
    noSelection: "Choose at least one album.",
    notFound: "Memory not found.",
    general: "General family collection",
    public: "Public",
    private: "Private",
  },
  es: {
    eyebrow: "Agregar a álbum",
    loading: "Cargando álbumes...",
    title: "Agregar este recuerdo a un álbum",
    subtitle:
      "Elige uno o más álbumes donde debe aparecer este recuerdo. El recuerdo original seguirá en tu biblioteca.",
    back: "Volver al recuerdo",
    noAlbumsTitle: "No hay álbumes disponibles",
    noAlbumsText:
      "Crea un álbum primero y después regresa para agregar este recuerdo.",
    createAlbum: "Crear álbum",
    addSelected: "Agregar a álbumes seleccionados",
    adding: "Agregando...",
    alreadyAdded: "Ya agregado",
    selected: "Seleccionado",
    add: "Agregar",
    saved: "Recuerdo agregado al álbum.",
    savedMultiple: "Recuerdo agregado a los álbumes.",
    noSelection: "Elige al menos un álbum.",
    notFound: "Recuerdo no encontrado.",
    general: "Álbum familiar general",
    public: "Público",
    private: "Privado",
  },
};

export default function AddMemoryToAlbumPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const language = useAppLanguage();
  const t = copy[language] || copy.en;

  const [loading, setLoading] = useState(true);
  const [memory, setMemory] = useState(null);
  const [collections, setCollections] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: memoryData, error: memoryError } = await supabase
        .from("media_assets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (memoryError || !memoryData) {
        setMemory(null);
        setLoading(false);
        return;
      }

      setMemory(memoryData);

      const { data: existingItems } = await supabase
        .from("memory_collection_items")
        .select("collection_id")
        .eq("memory_id", id);

      const existingIds = new Set((existingItems || []).map((item) => item.collection_id));

      let query = supabase
        .from("memory_collections")
        .select(`
          *,
          loved_ones (
            id,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      const { data: collectionData } = await query;

      const availableCollections = (collectionData || []).map((collection) => ({
        ...collection,
        alreadyAdded: existingIds.has(collection.id),
      }));

      setCollections(availableCollections);
      setLoading(false);
    }

    loadData();
  }, [id]);

  function toggleCollection(collectionId) {
    setSelectedIds((current) => {
      if (current.includes(collectionId)) {
        return current.filter((item) => item !== collectionId);
      }

      return [...current, collectionId];
    });
  }

  async function addToAlbums() {
    if (selectedIds.length === 0) {
      setMessage(t.noSelection);
      return;
    }

    setSaving(true);
    setMessage("");

    const rows = selectedIds.map((collectionId, index) => ({
      collection_id: collectionId,
      memory_id: id,
      sort_order: index,
    }));

    const { error } = await supabase
      .from("memory_collection_items")
      .insert(rows);

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(selectedIds.length > 1 ? t.savedMultiple : t.saved);

    setTimeout(() => {
      router.push(`/app/memories/${id}`);
    }, 700);
  }

  if (loading) {
    return (
      <main className="appShell addMemoriesShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.loading}</h1>
        </section>
      </main>
    );
  }

  if (!memory) {
    return (
      <main className="appShell addMemoriesShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.notFound}</h1>

          <Link href="/app/library" className="appButton">
            {t.back}
          </Link>
        </section>
      </main>
    );
  }

  const availableCollections = collections.filter((collection) => !collection.alreadyAdded);

  return (
    <main className="appShell addMemoriesShell">
      <section className="appHero compact newCollectionHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <Link href={`/app/memories/${id}`} className="appButton secondary">
          {t.back}
        </Link>
      </section>

      {message && <div className="successBox addMemoriesMessage">{message}</div>}

      {availableCollections.length === 0 ? (
        <section className="emptyStateCard collectionEmptyCard">
          <span>VE</span>
          <h2>{t.noAlbumsTitle}</h2>
          <p>{t.noAlbumsText}</p>

          <Link href="/app/collections/new" className="appButton">
            {t.createAlbum}
          </Link>
        </section>
      ) : (
        <>
          <section className="addMemoriesGrid">
            {availableCollections.map((collection) => {
              const selected = selectedIds.includes(collection.id);

              return (
                <article
                  key={collection.id}
                  className={selected ? "addMemoryCard selected" : "addMemoryCard"}
                >
                  <div>
                    <span className={collection.is_public ? "statusBadge public" : "statusBadge"}>
                      {collection.is_public ? t.public : t.private}
                    </span>

                    <h2>{collection.title}</h2>

                    <p>
                      {collection.description ||
                        collection.loved_ones?.full_name ||
                        t.general}
                    </p>

                    <small>
                      {collection.loved_ones?.full_name || t.general}
                    </small>
                  </div>

                  <button
                    type="button"
                    className={selected ? "appButton" : "appButton ghost"}
                    onClick={() => toggleCollection(collection.id)}
                  >
                    {selected ? t.selected : t.add}
                  </button>
                </article>
              );
            })}
          </section>

          <div className="addMemoriesFooter">
            <button
              type="button"
              className="appButton"
              onClick={addToAlbums}
              disabled={saving}
            >
              {saving ? t.adding : t.addSelected}
            </button>
          </div>
        </>
      )}
    </main>
  );
}