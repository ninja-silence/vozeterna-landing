"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Grid2X2, Plus } from "lucide-react";
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
    cardView: "Cards",
    bookView: "Album books",
  },
  es: {
    label: "Albumes",
    title: "Albumes de recuerdos",
    subtitle: "Organiza recuerdos en colecciones privadas para tu familia.",
    loading: "Cargando albumes...",
    emptyTitle: "Todavia no hay albumes",
    emptyText: "Crea un album para organizar recuerdos por persona, evento, bendicion, historia o temporada.",
    create: "Crear album",
    open: "Abrir album",
    private: "Privado",
    public: "Publico",
    noDescription: "Coleccion privada de recuerdos",
    cardView: "Tarjetas",
    bookView: "Libros",
  },
};

export default function MobileCollectionsPage() {
  const [language, setLanguage] = useState("en");
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("book");

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());

    const savedView = window.localStorage.getItem("vozeterna-album-view");
    if (savedView === "card" || savedView === "book") {
      setViewMode(savedView);
    }

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

  function changeView(nextView) {
    setViewMode(nextView);
    window.localStorage.setItem("vozeterna-album-view", nextView);
  }

  return (
    <section className="mobileScreenStack mobileAlbumsPolish">
      <section className="mobileAlbumHeroCard albumListHeroClean">
        <div>
          <p className="mobileCapsLabel">{t.label}</p>
          <h1>{t.title}</h1>
          <p className="mobileAlbumSubtitle">{t.subtitle}</p>
        </div>

        <div className="mobileAlbumActionRow">
          <Link href="/mobile/collections/new" className="mobileAlbumPrimaryBtn">
            <Plus size={17} />
            {t.create}
          </Link>

          <div className="albumViewToggle" aria-label="Album view mode">
            <button type="button" className={viewMode === "card" ? "active" : ""} onClick={() => changeView("card")}>
              <Grid2X2 size={15} />
              {t.cardView}
            </button>

            <button type="button" className={viewMode === "book" ? "active" : ""} onClick={() => changeView("book")}>
              <BookOpen size={15} />
              {t.bookView}
            </button>
          </div>
        </div>
      </section>

      <section className={viewMode === "book" ? "mobileAlbumBookShelf" : "mobileAlbumStack"}>
        {loading && <p className="mobileEmptyText">{t.loading}</p>}

        {!loading && albums.length === 0 && (
          <div className="mobileAlbumEmptyCard">
            <BookOpen size={26} className="mobileAlbumMemoryEmptyIcon" />
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
            className={viewMode === "book" ? "mobileAlbumBookLink" : "mobileAlbumListLink"}
          >
            <article className={viewMode === "book" ? "mobileAlbumBookCard" : "mobileAlbumListCard"}>
              <div className="albumBookCoverWindow">
                <BookOpen size={22} />
              </div>

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
                <span aria-hidden="true">→</span>
              </div>
            </article>
          </Link>
        ))}
      </section>
    </section>
  );
}
