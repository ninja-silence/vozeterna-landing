"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderHeart, Plus } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Albums",
    title: "Memory albums",
    subtitle: "Organize memories into private collections for your family or friends.",
    loading: "Loading albums...",
    emptyTitle: "No albums yet",
    emptyText: "Albums help organize memories by person, event, blessing, or story.",
    add: "Create album",
    open: "Open album",
    private: "Private",
    public: "Public",
  },
  es: {
    label: "Álbumes",
    title: "Álbumes de recuerdos",
    subtitle: "Organiza recuerdos en colecciones privadas para tu familia o amistades.",
    loading: "Cargando álbumes...",
    emptyTitle: "Todavía no hay álbumes",
    emptyText: "Los álbumes ayudan a organizar recuerdos por persona, evento, bendición o historia.",
    add: "Crear álbum",
    open: "Abrir álbum",
    private: "Privado",
    public: "Público",
  },
};

export default function MobileCollectionsPage() {
  const [language, setLanguage] = useState("en");
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());

    function handleLanguageChange(event) {
      if (event.detail === "en" || event.detail === "es") {
        setLanguage(event.detail);
      }
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("vozeterna-language-change", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    async function loadAlbums() {
      setLoading(true);

      const { data } = await supabase
        .from("memory_collections")
        .select("id, title, description, is_public, created_at")
        .order("created_at", { ascending: false });

      setAlbums(data || []);
      setLoading(false);
    }

    loadAlbums();
  }, []);

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>

        <Link href="/mobile/collections/new" className="mobileRecorderPrimary">
          <Plus size={17} />
          {t.add}
        </Link>
      </div>

      <section className="mobileCardList">
        {loading && <p className="mobileEmptyText">{t.loading}</p>}

        {!loading && albums.length === 0 && (
          <div className="mobileEmptyCard">
            <FolderHeart size={24} />
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>
            <Link href="/mobile/collections/new" className="mobileRecorderPrimary">
              <Plus size={17} />
              {t.add}
            </Link>
          </div>
        )}

        {albums.map((album) => (
          <Link className="mobileListCard mobileAlbumLinkCard" key={album.id} href={`/mobile/collections/${album.id}`}>
            <span className={album.is_public ? "mobileStatusPill public" : "mobileStatusPill"}>
              {album.is_public ? t.public : t.private}
            </span>

            <strong>{album.title}</strong>
            {album.description && <p>{album.description}</p>}

            <span className="mobileInlineAction">{t.open}</span>
          </Link>
        ))}
      </section>
    </section>
  );
}