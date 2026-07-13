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
    subtitle: "Organize memories into private family collections.",
    loading: "Loading albums...",
    emptyTitle: "No albums yet",
    emptyText: "Create an album to organize memories by person, event, blessing, story, or season.",
    create: "Create album",
    open: "Open album",
    private: "Private",
    public: "Public",
    noDescription: "Private memory collection",
  },
  es: {
    label: "Álbumes",
    title: "Álbumes de recuerdos",
    subtitle: "Organiza recuerdos en colecciones privadas para tu familia.",
    loading: "Cargando álbumes...",
    emptyTitle: "Todavía no hay álbumes",
    emptyText: "Crea un álbum para organizar recuerdos por persona, evento, bendición, historia o temporada.",
    create: "Crear álbum",
    open: "Abrir álbum",
    private: "Privado",
    public: "Público",
    noDescription: "Colección privada de recuerdos",
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

  function formatDate(value) {
    if (!value) return "";

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(value));
  }

  return (
    <section className="mobileScreenStack mobileAlbumsPolish">
      <section className="mobileAlbumHeroCard">
        <div>
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.title}</h1>
          <p className="mobileAlbumSubtitle">{t.subtitle}</p>
        </div>

        <Link href="/mobile/collections/new" className="mobileAlbumPrimaryBtn">
          <Plus size={17} />
          {t.create}
        </Link>
      </section>

      <section className="mobileAlbumStack">
        {loading && <p className="mobileEmptyText">{t.loading}</p>}

        {!loading && albums.length === 0 && (
          <div className="mobileAlbumEmptyCard">
            <FolderHeart size={26} className="mobileAlbumMemoryEmptyIcon" />
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>

            <Link href="/mobile/collections/new" className="mobileAlbumPrimaryBtn">
              <Plus size={17} />
              {t.create}
            </Link>
          </div>
        )}

        {albums.map((album) => (
          <Link
            key={album.id}
            href={`/mobile/collections/${album.id}`}
            className="mobileAlbumListLink"
          >
            <article className="mobileAlbumListCard">
              <div className="mobileAlbumMetaRow">
                <span className={album.is_public ? "mobileAlbumBadge isPublic" : "mobileAlbumBadge isPrivate"}>
                  {album.is_public ? t.public : t.private}
                </span>

                <span className="mobileAlbumSectionHint">
                  {formatDate(album.created_at)}
                </span>
              </div>

              <h2 className="mobileAlbumListTitle">{album.title}</h2>

              <p className="mobileAlbumListDesc">
                {album.description?.trim() || t.noDescription}
              </p>

              <div className="mobileAlbumListFooter">
                <span>{t.open}</span>
                <span>→</span>
              </div>
            </article>
          </Link>
        ))}
      </section>
    </section>
  );
}