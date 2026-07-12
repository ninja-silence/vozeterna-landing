"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileUp, ImagePlus, UploadCloud } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";
import { saveMobileMemoryToV2 } from "../../../lib/mobileVault";

const copy = {
  en: {
    label: "Mobile Upload",
    title: "Upload a memory",
    subtitle: "Choose a photo, audio file, video, or document from your phone without leaving the mobile app.",
    choose: "Choose file",
    selected: "Selected file",
    note: "Memory note",
    placeholder: "Write a short note about this memory...",
    upload: "Upload memory",
    uploading: "Uploading...",
    saved: "Memory uploaded.",
    signIn: "Please sign in before uploading.",
    noFile: "Choose a file first.",
    privateNote: "Files are private by default and saved inside your family network vault.",
  },
  es: {
    label: "Subida móvil",
    title: "Sube un recuerdo",
    subtitle: "Elige una foto, audio, video o documento desde tu teléfono sin salir de la app móvil.",
    choose: "Elegir archivo",
    selected: "Archivo seleccionado",
    note: "Nota del recuerdo",
    placeholder: "Escribe una nota corta sobre este recuerdo...",
    upload: "Subir recuerdo",
    uploading: "Subiendo...",
    saved: "Recuerdo subido.",
    signIn: "Inicia sesión antes de subir.",
    noFile: "Primero elige un archivo.",
    privateNote: "Los archivos son privados por defecto y se guardan dentro de tu bóveda familiar.",
  },
};

export default function MobileUploadPage() {
  const [language, setLanguage] = useState("en");
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

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

  async function uploadMemory() {
    setMessage("");

    if (!file) {
      setMessage(t.noFile);
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(t.signIn);
        setSaving(false);
        return;
      }

      await saveMobileMemoryToV2({
        supabase,
        user,
        file,
        title: note.trim() ? note.trim().slice(0, 80) : file.name,
        note,
        folder: "mobile-uploads",
      });

      setMessage(t.saved);
      setFile(null);
      setNote("");

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      setMessage(error.message || "Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="mobileFormCard mobileUploadCard">
        <button
          type="button"
          className="mobileUploadPicker"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={28} />
          <strong>{t.choose}</strong>
          <span>{t.privateNote}</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />

        {file && (
          <div className="mobileSelectedFile">
            <FileUp size={18} />
            <div>
              <strong>{t.selected}</strong>
              <span>{file.name}</span>
            </div>
          </div>
        )}

        <label>
          {t.note}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t.placeholder}
          />
        </label>

        <button type="button" onClick={uploadMemory} disabled={saving}>
          <UploadCloud size={17} />
          {saving ? t.uploading : t.upload}
        </button>

        {message && (
          <p className={message === t.saved ? "mobileSuccessMessage" : "mobileFormMessage"}>
            {message === t.saved && <CheckCircle2 size={16} />}
            <span>{message}</span>
          </p>
        )}
      </section>
    </section>
  );
}