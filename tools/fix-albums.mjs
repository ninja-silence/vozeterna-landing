import fs from "fs";
import path from "path";

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function read(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function cleanText(content) {
  return content
    .replaceAll("ÃA", "A")
    .replaceAll("Ã‰", "E")
    .replaceAll("ÃM", "I")
    .replaceAll("Ã“", "O")
    .replaceAll("Ãš", "U")
    .replaceAll("Ã‘", "N")
    .replaceAll("Ã¡", "a")
    .replaceAll("Ã©", "e")
    .replaceAll("Ã­", "i")
    .replaceAll("Ã³", "o")
    .replaceAll("Ãº", "u")
    .replaceAll("Ã±", "n")
    .replaceAll("Â¿", "")
    .replaceAll("Â¡", "")
    .replaceAll("Â·", "-")
    .replaceAll("Â", "")
    .replaceAll("�", "")
    .replaceAll("Álbumes", "Albumes")
    .replaceAll("Álbum", "Album")
    .replaceAll("álbumes", "albumes")
    .replaceAll("álbum", "album")
    .replaceAll("Público", "Publico")
    .replaceAll("público", "publico")
    .replaceAll("Todavía", "Todavia")
    .replaceAll("todavía", "todavia")
    .replaceAll("Descripción", "Descripcion")
    .replaceAll("descripción", "descripcion")
    .replaceAll("colección", "coleccion")
    .replaceAll("Colección", "Coleccion")
    .replaceAll("bendición", "bendicion")
    .replaceAll("Bendición", "Bendicion")
    .replaceAll("mamá", "mama")
    .replaceAll("Mamá", "Mama")
    .replaceAll("está", "esta");
}

const collectionsPage = `"use client";

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
            href={\`/mobile/collections/\${album.id}\`}
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
`;

write("src/app/mobile/collections/page.jsx", collectionsPage);

const filesToClean = [
  "src/app/mobile/collections/new/page.jsx",
  "src/app/mobile/collections/[id]/page.jsx",
  "src/app/mobile/collections/[id]/edit/page.jsx",
  "src/app/mobile/collections/[id]/add/page.jsx",
  "src/app/mobile/upload/page.jsx",
];

for (const file of filesToClean) {
  if (fs.existsSync(file)) {
    write(file, cleanText(read(file)));
  }
}

let upload = read("src/app/mobile/upload/page.jsx");

if (!upload.includes("function cleanDisplayText")) {
  upload = upload.replace(
    `  const t = copy[language] || copy.en;`,
    `  const t = copy[language] || copy.en;

  function cleanDisplayText(value = "") {
    return String(value || "")
      .replaceAll("Ã¡", "a")
      .replaceAll("Ã©", "e")
      .replaceAll("Ã­", "i")
      .replaceAll("Ã³", "o")
      .replaceAll("Ãº", "u")
      .replaceAll("Ã±", "n")
      .replaceAll("Â·", "-")
      .replaceAll("Â", "")
      .replaceAll("�", "")
      .replace(/\\s+/g, " ")
      .trim();
  }`
  );
}

upload = upload
  .replaceAll(`{(vault.subject_name || vault.title) + " · " + (vault.relationship_label || "Vault")}`, `{cleanDisplayText((vault.subject_name || vault.title) + " - " + (vault.relationship_label || "Vault"))}`)
  .replaceAll(`{(vault.subject_name || vault.title) + " Â· " + (vault.relationship_label || "Vault")}`, `{cleanDisplayText((vault.subject_name || vault.title) + " - " + (vault.relationship_label || "Vault"))}`)
  .replaceAll(`{(vault.subject_name || vault.title) + " - " + (vault.relationship_label || "Vault")}`, `{cleanDisplayText((vault.subject_name || vault.title) + " - " + (vault.relationship_label || "Vault"))}`);

write("src/app/mobile/upload/page.jsx", upload);

let css = read("src/app/globals.css");

css = css
  .replaceAll(`content: "Premium frame";`, `content: "Basic frame";`)
  .replaceAll(`content: "PREMIUM FRAME";`, `content: "BASIC FRAME";`);

if (!css.includes("VozEterna Album Stabilization v4")) {
  css += `

/* ===== VozEterna Album Stabilization v4 ===== */

.mobileAlbumsPolish {
  width: min(720px, calc(100vw - 32px));
  margin-left: auto !important;
  margin-right: auto !important;
  padding-bottom: 150px !important;
}

.albumListHeroClean {
  overflow: hidden !important;
}

.albumListHeroClean h1 {
  max-width: 100% !important;
  overflow-wrap: normal !important;
  word-break: normal !important;
}

.albumViewToggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px;
  border-radius: 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
}

.albumViewToggle button {
  min-height: 38px;
  padding: 0 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: rgba(245,250,252,0.72);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 850;
  cursor: pointer;
}

.albumViewToggle button.active {
  background: rgba(90, 216, 230, 0.18);
  color: #ffffff;
}

.mobileAlbumBookShelf {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(164px, 1fr));
  gap: 18px;
  align-items: stretch;
}

.mobileAlbumBookLink {
  text-decoration: none;
  color: inherit;
  display: block;
}

.mobileAlbumBookCard {
  position: relative;
  min-height: 230px;
  padding: 22px 18px 18px 28px;
  border-radius: 22px 18px 18px 22px;
  background:
    linear-gradient(90deg, rgba(255,255,255,0.08) 0 4px, transparent 4px 100%),
    radial-gradient(circle at 70% 10%, rgba(91,221,233,0.12), transparent 34%),
    linear-gradient(135deg, rgba(16, 51, 64, 0.98), rgba(5, 28, 40, 0.98));
  border: 1px solid rgba(120, 220, 235, 0.14);
  box-shadow:
    14px 20px 40px rgba(0,0,0,0.28),
    inset 9px 0 16px rgba(0,0,0,0.18),
    inset 0 1px 0 rgba(255,255,255,0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobileAlbumBookCard::before,
.mobileAlbumBookCard::after {
  display: none !important;
  content: none !important;
}

.albumBookCoverWindow {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  color: rgba(245,250,252,0.86);
}

.mobileAlbumBookCard .mobileAlbumMetaRow {
  order: -1;
}

.mobileAlbumBookCard .mobileAlbumListTitle {
  color: #ffffff !important;
  font-size: 1.25rem !important;
  line-height: 1.1 !important;
  margin-top: auto !important;
}

.mobileAlbumBookCard .mobileAlbumListFooter {
  margin-top: auto;
}

.mobileAlbumMemoryCard:has(.mobileMemoryPreviewImage)::before {
  content: "Basic frame" !important;
  background: rgba(70, 38, 14, 0.72) !important;
  color: #ffe0a0 !important;
}

/* Light mode consistency */
html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileAlbumHeroCard,
html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileAlbumPanel,
html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileAlbumFormCard,
html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileAlbumEmptyCard,
html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileAlbumMemoryCard,
html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileAlbumListCard,
html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileAlbumBookCard,
body:not(.dark) .mobileAlbumsPolish .mobileAlbumHeroCard,
body:not(.dark) .mobileAlbumsPolish .mobileAlbumPanel,
body:not(.dark) .mobileAlbumsPolish .mobileAlbumFormCard,
body:not(.dark) .mobileAlbumsPolish .mobileAlbumEmptyCard,
body:not(.dark) .mobileAlbumsPolish .mobileAlbumMemoryCard,
body:not(.dark) .mobileAlbumsPolish .mobileAlbumListCard,
body:not(.dark) .mobileAlbumsPolish .mobileAlbumBookCard {
  background:
    radial-gradient(circle at 16% 10%, rgba(255, 221, 166, 0.26), transparent 30%),
    linear-gradient(135deg, rgba(255,255,255,0.96), rgba(244, 238, 226, 0.96)) !important;
  border-color: rgba(22, 68, 82, 0.12) !important;
  color: #123747 !important;
  box-shadow: 0 22px 52px rgba(55, 44, 30, 0.12) !important;
}

html:not([data-theme="dark"]) .mobileAlbumsPolish h1,
html:not([data-theme="dark"]) .mobileAlbumsPolish h2,
html:not([data-theme="dark"]) .mobileAlbumsPolish h3,
body:not(.dark) .mobileAlbumsPolish h1,
body:not(.dark) .mobileAlbumsPolish h2,
body:not(.dark) .mobileAlbumsPolish h3 {
  color: #123747 !important;
  text-shadow: none !important;
}

html:not([data-theme="dark"]) .mobileAlbumsPolish p,
html:not([data-theme="dark"]) .mobileAlbumsPolish span,
body:not(.dark) .mobileAlbumsPolish p,
body:not(.dark) .mobileAlbumsPolish span {
  color: rgba(18, 55, 71, 0.72);
}

html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileCapsLabel,
body:not(.dark) .mobileAlbumsPolish .mobileCapsLabel {
  color: rgba(14, 92, 108, 0.9) !important;
}

html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileAlbumPrimaryBtn,
body:not(.dark) .mobileAlbumsPolish .mobileAlbumPrimaryBtn {
  background: linear-gradient(135deg, #55d4e4, #23a8bc) !important;
  color: #06242e !important;
}

html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileAlbumSecondaryBtn,
html:not([data-theme="dark"]) .mobileAlbumsPolish .mobileAlbumGhostBtn,
body:not(.dark) .mobileAlbumsPolish .mobileAlbumSecondaryBtn,
body:not(.dark) .mobileAlbumsPolish .mobileAlbumGhostBtn {
  background: rgba(18, 55, 71, 0.06) !important;
  color: #123747 !important;
  border-color: rgba(18, 55, 71, 0.10) !important;
}

html:not([data-theme="dark"]) .albumViewToggle,
body:not(.dark) .albumViewToggle {
  background: rgba(18,55,71,0.06);
  border-color: rgba(18,55,71,0.10);
}

html:not([data-theme="dark"]) .albumViewToggle button,
body:not(.dark) .albumViewToggle button {
  color: rgba(18,55,71,0.68);
}

html:not([data-theme="dark"]) .albumViewToggle button.active,
body:not(.dark) .albumViewToggle button.active {
  color: #123747;
  background: rgba(85, 212, 228, 0.25);
}

@media (max-width: 720px) {
  .mobileAlbumsPolish {
    width: min(100%, calc(100vw - 24px));
  }

  .mobileAlbumBookShelf {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .mobileAlbumBookCard {
    min-height: 210px;
    padding: 18px 14px 16px 24px;
  }

  .albumViewToggle {
    width: 100%;
    justify-content: space-between;
  }

  .albumViewToggle button {
    flex: 1;
    justify-content: center;
  }
}
`;
}

write("src/app/globals.css", css);
console.log("Album recovery patch applied.");
