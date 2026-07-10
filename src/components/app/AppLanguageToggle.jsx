"use client";

export default function AppLanguageToggle({ language, setLanguage }) {
  return (
    <div className="appLanguageToggle" aria-label="Language selector">
      <button
        type="button"
        className={language === "en" ? "active" : ""}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>

      <button
        type="button"
        className={language === "es" ? "active" : ""}
        onClick={() => setLanguage("es")}
      >
        ES
      </button>
    </div>
  );
}