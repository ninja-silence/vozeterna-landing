"use client";

import { useEffect, useState } from "react";
import { getStoredAppLanguage } from "./appLanguage";

export function useAppLanguage() {
  const [language, setLanguage] = useState("en");

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

  return language;
}