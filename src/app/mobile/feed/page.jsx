"use client";

import { useEffect, useState } from "react";
import FamilyActivityFeed from "../../../components/social/FamilyActivityFeed";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Family Network",
    title: "Network feed",
    subtitle: "Private updates from the family and friend networks you belong to.",
  },
  es: {
    label: "Red familiar",
    title: "Feed de la red",
    subtitle: "Actualizaciones privadas de las redes familiares y de amigos a las que perteneces.",
  },
};

export default function MobileFeedPage() {
  const [language, setLanguage] = useState("en");
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

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <FamilyActivityFeed />
    </section>
  );
}