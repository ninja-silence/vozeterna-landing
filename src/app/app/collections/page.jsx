"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useAppLanguage } from "../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Collections",
    title: "Albums for family memories",
    subtitle:
      "Group photos, voices, videos, stories, and keepsakes into curated family albums.",
    create: "Create collection",
    emptyTitle: "No collections yet",
    emptyText:
      "Create your first album to organize memories by person, season, theme, or family story.",
    linkedTo: "Album",
    unassigned: "General family collection",
    private: "Private",
    public: "Public",
    memories: "memories",
    open: "Open collection",
    loading: "Loading collections...",
  },
  es: {
    eyebrow: "Álbumes",
    title: "Álbumes para recuerdos familiares",
    subtitle:
      "Agrupa fotos, voces, videos, historias y recuerdos especiales en álbumes familiares curados.",
    create: "Crear álbum",
    emptyTitle: "Todavía no hay álbumes",
    emptyText:
      "Crea tu primer álbum para organizar recuerdos por persona, temporada, tema o historia familiar.",
    linkedTo: "Álbum",
    unassigned: "Álbum familiar general",
    private: "Privado",
    public: "Público",
    memories: "recuerdos",
    open: "Abrir álbum",
    loading: "Cargando álbumes...",
  },
};

export default function CollectionsPage() {
  const language = useAppLanguage();
  const t = copy[language] || copy.en;

  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    async function loadCollections() {
      const { data, error } = await supabase
        .from("memory_collections")
        .select(`
          *,
          loved_ones (
            id,
            full_name
          ),
          memory_collection_items (
            id
          )
        `)
        .order("created_at", { ascending: false });

      if (!error) {
        setCollections(data || []);
      }

      setLoading(false);
    }

    loadCollections();
  }, []);

  if (loading) {
    return (
      <main className="appShell collectionsShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.loading}</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell collectionsShell">
      <section className="collectionsHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <Link href="/app/collections/new" className="appButton">
          {t.create}
        </Link>
      </section>

      {collections.length === 0 ? (
        <section className="emptyStateCard collectionsEmpty">
          <span>VE</span>
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>

          <Link href="/app/collections/new" className="appButton">
            {t.create}
          </Link>
        </section>
      ) : (
        <section className="collectionsGrid">
          {collections.map((collection) => {
            const memoryCount = collection.memory_collection_items?.length || 0;
            const lovedOneName = collection.loved_ones?.full_name || t.unassigned;

            return (
              <article className="collectionCard" key={collection.id}>
                <div className="collectionCardTop">
                  <span className="collectionIcon">VE</span>

                  <span className={collection.is_public ? "publicStatus" : "privateStatus"}>
                    {collection.is_public ? t.public : t.private}
                  </span>
                </div>

                <div>
                  <p className="appEyebrow">{t.linkedTo}</p>
                  <h2>{collection.title}</h2>
                  <p>{collection.description || lovedOneName}</p>
                </div>

                <div className="collectionCardMeta">
                  <span>{lovedOneName}</span>
                  <span>
                    {memoryCount} {t.memories}
                  </span>
                </div>

                <Link href={`/app/collections/${collection.id}`} className="appButton secondary">
                  {t.open}
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}