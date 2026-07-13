"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLanguageToggle from "../../../components/app/AppLanguageToggle";
import { supabase } from "../../../lib/supabaseClient";
import { getStoredAppLanguage } from "../../../lib/appLanguage";
import { getRelationshipLabel } from "../../../lib/relationshipLabels";
import { normalizeStoragePath, warnInvalidStoragePath } from "../../../lib/storagePaths";

const copy = {
  en: {
    memorial: "VozEterna Memorial",
    livingLegacy: "VozEterna Living Legacy Page",
    loading: "Loading memorial...",
    notFound: "Memorial not found",
    notFoundText: "This memorial page may be private, unavailable, or not yet published.",
    familyTribute: "Family Tribute",
    livingTribute: "Living Legacy",
    approvedPage: "A public page for approved memories",
    approvedText:
      "This memorial shows only memories selected for public sharing. Private family memories remain protected in the family vault.",
    sharedMemories: "Shared Memories",
    sharedByFamily: "Memories shared by family",
    noPublicMemories: "No public memories yet",
    noPublicMemoriesText:
      "The family has not shared any public memories on this memorial page yet.",
    preserved: "Preserved with VozEterna",
    protected: "Private family memories remain protected.",
    shared: "Shared",
    memoryTypes: {
      photo_of_person: "Photo",
      photo_from_person: "Photo",
      story_about_person: "Story",
      message_from_person: "Message",
      voice_of_person: "Voice",
      family_memory: "Family Memory",
      document_or_keepsake: "Keepsake",
    },
  },
  es: {
    memorial: "Memorial de VozEterna",
    livingLegacy: "Página de legado en vida de VozEterna",
    loading: "Cargando memorial...",
    notFound: "Memorial no encontrado",
    notFoundText:
      "Esta página memorial puede ser privada, no estar disponible o todavía no estar publicada.",
    familyTribute: "Tributo familiar",
    livingTribute: "Legado en vida",
    approvedPage: "Una página pública para recuerdos aprobados",
    approvedText:
      "Este memorial muestra únicamente recuerdos seleccionados para compartirse públicamente. Los recuerdos familiares privados permanecen protegidos en la bóveda familiar.",
    sharedMemories: "Recuerdos compartidos",
    sharedByFamily: "Recuerdos compartidos por la familia",
    noPublicMemories: "Todavía no hay recuerdos públicos",
    noPublicMemoriesText:
      "La familia todavía no ha compartido recuerdos públicos en esta página memorial.",
    preserved: "Preservado con VozEterna",
    protected: "Los recuerdos familiares privados permanecen protegidos.",
    shared: "Compartido",
    memoryTypes: {
      photo_of_person: "Foto",
      photo_from_person: "Foto",
      story_about_person: "Historia",
      message_from_person: "Mensaje",
      voice_of_person: "Voz",
      family_memory: "Recuerdo familiar",
      document_or_keepsake: "Recuerdo especial",
    },
  },
};

export default function PublicMemorialPage() {
  const params = useParams();
  const slug = params.slug;

  const [language, setLanguage] = useState("en");
  const [person, setPerson] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [memories, setMemories] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getStoredAppLanguage());

    function handleLanguageChange(event) {
      setLanguage(event.detail?.language || getStoredAppLanguage());
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("vozeterna-language-change", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    async function loadMemorial() {
      const { data: profileData, error: profileError } = await supabase
        .from("loved_ones")
        .select("*")
        .eq("memorial_slug", slug)
        .eq("memorial_public", true)
        .maybeSingle();

      if (profileError || !profileData) {
        setLoading(false);
        return;
      }

      setPerson(profileData);

      const profilePhotoPath = normalizeStoragePath(profileData.profile_photo_path);
      if (profilePhotoPath) {
        const { data: signedPhotoData, error: signedPhotoError } = await supabase.storage
          .from("family-media")
          .createSignedUrl(profilePhotoPath, 60 * 10);

        if (!signedPhotoError && signedPhotoData?.signedUrl) {
          setProfilePhotoUrl(signedPhotoData.signedUrl);
        } else {
          warnInvalidStoragePath("public memorial profile photo", profileData.profile_photo_path);
        }
      } else if (profileData.profile_photo_path) {
        warnInvalidStoragePath("public memorial profile photo", profileData.profile_photo_path);
      }

      const { data: memoryData } = await supabase
        .from("media_assets")
        .select("*")
        .eq("loved_one_id", profileData.id)
        .eq("show_on_memorial", true)
        .order("created_at", { ascending: false });

      const publicMemories = memoryData || [];
      setMemories(publicMemories);

      const urlMap = {};

      for (const memory of publicMemories) {
        const filePath = normalizeStoragePath(memory.file_path);
        if (!filePath) {
          if (memory.file_path) warnInvalidStoragePath("public memorial memory", memory.file_path);
          continue;
        }

        const { data: signedData, error: signedError } = await supabase.storage
          .from("family-media")
          .createSignedUrl(filePath, 60 * 10);

        if (!signedError && signedData?.signedUrl) {
          urlMap[memory.id] = signedData.signedUrl;
        } else {
          warnInvalidStoragePath("public memorial memory", memory.file_path);
        }
      }

      setSignedUrls(urlMap);
      setLoading(false);
    }

    loadMemorial();
  }, [slug]);

  function getInitials(name) {
    return (
      name
        ?.split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "VE"
    );
  }

  function formatDate(value) {
    if (!value) return null;

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(`${value}T00:00:00`));
  }

  function formatSavedDate(value) {
    if (!value) return "";

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(value));
  }

  function getFileKind(fileName, fileType) {
    const type = fileType || "";
    const lower = String(fileName || "").toLowerCase();

    if (type.startsWith("image/") || lower.match(/\.(jpg|jpeg|png|webp)$/)) return "image";
    if (type.startsWith("audio/") || lower.match(/\.(mp3|wav|webm|mpeg)$/)) return "audio";
    if (type.startsWith("video/") || lower.match(/\.(mp4|mov|webm|quicktime)$/)) return "video";

    return "file";
  }

  function formatMemoryType(type) {
    return t.memoryTypes[type] || (language === "es" ? "Recuerdo" : "Memory");
  }

  function getPageModeLabel() {
    if (!person?.death_date) {
      return t.livingLegacy;
    }

    return t.memorial;
  }

  if (loading) {
    return (
      <main className="publicMemorialShell">
        <section className="publicMemorialNotFound">
          <p className="appEyebrow">{t.memorial}</p>
          <h1>{t.loading}</h1>
        </section>
      </main>
    );
  }

  if (!person) {
    return (
      <main className="publicMemorialShell">
        <section className="publicMemorialNotFound">
          <div className="publicMemorialLanguage">
            <AppLanguageToggle language={language} setLanguage={setLanguage} />
          </div>

          <p className="appEyebrow">{t.memorial}</p>
          <h1>{t.notFound}</h1>
          <p>{t.notFoundText}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="publicMemorialShell">
      <div className="publicMemorialLanguage">
        <AppLanguageToggle language={language} setLanguage={setLanguage} />
      </div>

      <section className="publicMemorialHero">
        <div className="publicMemorialPhotoFrame">
          <div className={`publicMemorialPhoto ${person.frame_style || "classic_gold"}`}>
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt={person.full_name} />
            ) : (
              <span>{getInitials(person.full_name)}</span>
            )}
          </div>
        </div>

        <div className="publicMemorialText">
          <p className="appEyebrow">{getPageModeLabel()}</p>

          <h1>{person.full_name}</h1>

          {getRelationshipLabel(person, language) && <h2>{getRelationshipLabel(person, language)}</h2>}

          <div className="publicMemorialDates">
            {person.birth_date && <span>{formatDate(person.birth_date)}</span>}
            {person.birth_date && person.death_date && <span>—</span>}
            {person.death_date && <span>{formatDate(person.death_date)}</span>}
          </div>

          {(language === "es" ? person.bio_es || person.bio : person.bio || person.bio_es) && (
            <p className="publicMemorialBio">
              {language === "es" ? person.bio_es || person.bio : person.bio || person.bio_es}
            </p>
          )}

          <div className="publicMemorialSeal">
            <span>VE</span>
            <p>{t.preserved}</p>
          </div>
        </div>
      </section>

      <section className="publicMemorialProtection">
        <div>
          <p className="appEyebrow">{person.death_date ? t.familyTribute : t.livingTribute}</p>
          <h2>{t.approvedPage}</h2>
          <p>{t.approvedText}</p>
        </div>
      </section>

      {memories.length > 0 ? (
        <section className="publicMemorySection">
          <div className="publicMemoryHeader">
            <p className="appEyebrow">{t.sharedMemories}</p>
            <h2>{t.sharedByFamily}</h2>
          </div>

          <div className="publicMemoryGrid">
            {memories.map((memory) => {
              const kind = getFileKind(memory.file_name, memory.file_type);
              const url = signedUrls[memory.id];

              return (
                <article className="publicMemoryCard" key={memory.id}>
                  <div className="publicMemoryPreview">
                    {kind === "image" && url && <img src={url} alt={memory.file_name} />}
                    {kind === "audio" && url && (
                      <div className="publicAudioMemory">
                        <span>♪</span>
                        <audio controls src={url} />
                      </div>
                    )}
                    {kind === "video" && url && <video controls src={url} />}
                    {kind === "file" && <span className="publicFileMemory">VE</span>}

                    <div className="publicMemoryBadge">
                      {formatMemoryType(memory.memory_type)}
                    </div>
                  </div>

                  <div className="publicMemoryInfo">
                    <h3>{memory.memory_note || memory.title || formatMemoryType(memory.memory_type)}</h3>

                    {memory.file_name && <p>{memory.file_name}</p>}

                    {memory.created_at && (
                      <small>
                        {t.shared} {formatSavedDate(memory.created_at)}
                      </small>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="publicMemoryEmpty">
          <p className="appEyebrow">{t.sharedMemories}</p>
          <h2>{t.noPublicMemories}</h2>
          <p>{t.noPublicMemoriesText}</p>
        </section>
      )}

      <footer className="publicMemorialFooter">
        <p>{t.preserved}</p>
        <small>{t.protected}</small>
      </footer>
    </main>
  );
}
