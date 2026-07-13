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
    profile: "Attach to profile",
    profileFallback: "Default family vault",
    note: "Memory note",
    placeholder: "Write a short note about this memory...",
    upload: "Upload memory",
    uploading: "Uploading...",
    saved: "Memory uploaded.",
    signIn: "Please sign in before uploading.",
    noFile: "Choose a file first.",
    privateNote: "Files are private by default and saved inside the selected profile.",
  },
  es: {
    label: "Subida mÃƒÂ³vil",
    title: "Sube un recuerdo",
    subtitle: "Elige una foto, audio, video o documento desde tu telÃƒÂ©fono sin salir de la app mÃƒÂ³vil.",
    choose: "Elegir archivo",
    selected: "Archivo seleccionado",
    profile: "Conectar a perfil",
    profileFallback: "BÃƒÂ³veda familiar predeterminada",
    note: "Nota del recuerdo",
    placeholder: "Escribe una nota corta sobre este recuerdo...",
    upload: "Subir recuerdo",
    uploading: "Subiendo...",
    saved: "Recuerdo subido.",
    signIn: "Inicia sesiÃƒÂ³n antes de subir.",
    noFile: "Primero elige un archivo.",
    privateNote: "Los archivos son privados por defecto y se guardan dentro del perfil seleccionado.",
  },
};

export default function MobileUploadPage() {
  const [language, setLanguage] = useState("en");
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [vaults, setVaults] = useState([]);
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
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

  useEffect(() => {
    loadVaults();
  }, []);

  async function loadVaults() {
    const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const queryVaultId = queryParams?.get("vaultId") || "";
    const queryAlbumId = queryParams?.get("albumId") || queryParams?.get("collectionId") || "";
    setSelectedAlbumId(queryAlbumId);

    const { data } = await supabase
      .from("vaults")
      .select("id, network_id, title, subject_name, relationship_label, description")
      .order("created_at", { ascending: false });

    const rows = data || [];
    setVaults(rows);

    if (queryVaultId) {
      setSelectedVaultId(queryVaultId);
    } else if (rows.length > 0) {
      setSelectedVaultId(rows[0].id);
    }
  }

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
        targetVaultId: selectedVaultId || undefined,
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
        <label>
          {t.profile}
          <select
            value={selectedVaultId}
            onChange={(event) => setSelectedVaultId(event.target.value)}
          >
            <option value="">{t.profileFallback}</option>
            {vaults.map((vault) => (
              <option value={vault.id} key={vault.id}>
                {(vault.subject_name || vault.title) + " Ã‚Â· " + (vault.relationship_label || "Vault")}
              </option>
            ))}
          </select>
        </label>

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