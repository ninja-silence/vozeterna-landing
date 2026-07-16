"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileUp, ImagePlus, UploadCloud } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";
import { getVaultAccess, loadAccessibleVaults, saveMobileMemoryToV2 } from "../../../lib/mobileVault";

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
    preparing: "Preparing upload...",
    savingMemory: "Saving memory...",
    saved: "Memory uploaded.",
    failed: "Upload failed. Please try again.",
    fileLabel: "File",
    typeLabel: "Type",
    sizeLabel: "Size",
    uploadedLabel: "Uploaded",
    photoType: "Photo",
    audioType: "Audio",
    videoType: "Video",
    fileType: "File",
    signIn: "Please sign in before uploading.",
    noFile: "Choose a file first.",
    chooseVault: "Choose or create a vault before uploading.",
    privateNote: "Files are private by default and saved inside the selected profile.",
  },
  es: {
    label: "Subida movil",
    title: "Sube un recuerdo",
    subtitle: "Elige una foto, audio, video o documento desde tu telefono sin salir de la app movil.",
    choose: "Elegir archivo",
    selected: "Archivo seleccionado",
    profile: "Conectar a perfil",
    profileFallback: "Boveda familiar predeterminada",
    note: "Nota del recuerdo",
    placeholder: "Escribe una nota corta sobre este recuerdo...",
    upload: "Subir recuerdo",
    uploading: "Subiendo...",
    preparing: "Preparando carga...",
    savingMemory: "Guardando recuerdo...",
    saved: "Recuerdo subido.",
    failed: "Error al subir. Intentalo de nuevo.",
    fileLabel: "Archivo",
    typeLabel: "Tipo",
    sizeLabel: "Tamano",
    uploadedLabel: "Subido",
    photoType: "Foto",
    audioType: "Audio",
    videoType: "Video",
    fileType: "Archivo",
    signIn: "Inicia sesion antes de subir.",
    noFile: "Primero elige un archivo.",
    chooseVault: "Elige o crea una boveda antes de subir.",
    privateNote: "Los archivos son privados por defecto y se guardan dentro del perfil seleccionado.",
  },
};

export default function MobileUploadPage() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [vaults, setVaults] = useState([]);
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const inputRef = useRef(null);
  const progressTimerRef = useRef(null);

  const t = copy[language] || copy.en;

  function cleanDisplayText(value = "") {
    return String(value || "")
      .replace(/[\u00c3\u00c2\ufffd]/g, "")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u00b7/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatBytes(bytes = 0) {
    const safeBytes = Number(bytes) || 0;
    if (safeBytes <= 0) return "0 MB";
    return `${(safeBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function getReadableFileType(selectedFile) {
    if (!selectedFile) return "";
    if (selectedFile.type?.startsWith("image/")) return t.photoType;
    if (selectedFile.type?.startsWith("audio/")) return t.audioType;
    if (selectedFile.type?.startsWith("video/")) return t.videoType;
    return selectedFile.type || t.fileType;
  }

  function getProgressStatusText(progress = uploadProgress) {
    if (!progress) return "";
    if (progress.status === "preparing") return t.preparing;
    if (progress.status === "uploading") return t.uploading;
    if (progress.status === "saving") return t.savingMemory;
    if (progress.status === "success") return t.saved;
    if (progress.status === "error") return t.failed;
    return t.preparing;
  }

  function resetUploadProgress(selectedFile = file) {
    window.clearInterval(progressTimerRef.current);
    if (!selectedFile) {
      setUploadProgress(null);
      return;
    }

    setUploadProgress({
      percent: 0,
      uploadedBytes: 0,
      totalBytes: selectedFile.size || 0,
      status: "preparing",
    });
  }

  function updateUploadProgress(nextProgress) {
    setUploadProgress((current) => ({
      percent: Math.max(current?.percent || 0, Math.round(nextProgress.percent || 0)),
      uploadedBytes: nextProgress.uploadedBytes ?? current?.uploadedBytes ?? 0,
      totalBytes: nextProgress.totalBytes ?? current?.totalBytes ?? file?.size ?? 0,
      status: nextProgress.status || current?.status || "preparing",
    }));
  }

  function startStagedUploadProgress(selectedFile) {
    window.clearInterval(progressTimerRef.current);
    setUploadProgress({
      percent: 10,
      uploadedBytes: 0,
      totalBytes: selectedFile.size || 0,
      status: "uploading",
    });

    progressTimerRef.current = window.setInterval(() => {
      setUploadProgress((current) => {
        if (!current || current.status !== "uploading") return current;
        const nextPercent = Math.min(85, current.percent + 3);
        return {
          ...current,
          percent: nextPercent,
          uploadedBytes: Math.round((selectedFile.size || 0) * (nextPercent / 100)),
        };
      });
    }, 550);
  }

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
      window.clearInterval(progressTimerRef.current);
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setVaults([]);
      return;
    }

    const accessibleVaults = await loadAccessibleVaults(
      supabase,
      user,
      "id, network_id, created_by, title, subject_name, relationship_label, description, created_at"
    );
    const rowsWithAccess = await Promise.all(
      accessibleVaults.map(async (vault) => ({
        ...vault,
        access: await getVaultAccess(supabase, user, vault),
      }))
    );
    const rows = rowsWithAccess.filter((vault) => vault.access.canUpload);
    setVaults(rows);

    if (queryVaultId && rows.some((vault) => vault.id === queryVaultId)) {
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
    resetUploadProgress(file);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(t.signIn);
        setSaving(false);
        updateUploadProgress({ percent: 0, status: "error", totalBytes: file.size || 0 });
        return;
      }

      if (!selectedVaultId) {
        setMessage(t.chooseVault);
        setSaving(false);
        updateUploadProgress({ percent: 0, status: "error", totalBytes: file.size || 0 });
        return;
      }

      startStagedUploadProgress(file);

      const result = await saveMobileMemoryToV2({
        supabase,
        user,
        file,
        title: note.trim() ? note.trim().slice(0, 80) : file.name,
        note,
        folder: "mobile-uploads",
        targetVaultId: selectedVaultId || undefined,
        onProgress: updateUploadProgress,
      });

      if (selectedAlbumId && result?.memoryId) {
        window.clearInterval(progressTimerRef.current);
        updateUploadProgress({
          percent: 95,
          uploadedBytes: file.size || 0,
          totalBytes: file.size || 0,
          status: "saving",
        });

        const { count } = await supabase
          .from("memory_collection_items")
          .select("id", { count: "exact", head: true })
          .eq("collection_id", selectedAlbumId);

        const { error: albumError } = await supabase.from("memory_collection_items").insert({
          collection_id: selectedAlbumId,
          memory_id: result.memoryId,
          sort_order: count || 0,
        });

        if (albumError) {
          throw new Error(albumError.message);
        }
      }

      window.clearInterval(progressTimerRef.current);
      updateUploadProgress({
        percent: 100,
        uploadedBytes: file.size || 0,
        totalBytes: file.size || 0,
        status: "success",
      });
      setMessage(t.saved);
      setNote("");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      if (selectedAlbumId) {
        router.push(`/mobile/collections/${selectedAlbumId}`);
      }
    } catch (error) {
      window.clearInterval(progressTimerRef.current);
      updateUploadProgress({
        percent: uploadProgress?.percent || 0,
        uploadedBytes: uploadProgress?.uploadedBytes || 0,
        totalBytes: file?.size || 0,
        status: "error",
      });
      setMessage(error.message || t.failed);
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
    setMessage("");
    resetUploadProgress(nextFile);
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
                {cleanDisplayText(`${vault.subject_name || vault.title || t.profileFallback} - ${vault.relationship_label || "Vault"}`)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="mobileUploadPicker"
          disabled={saving}
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
          disabled={saving}
          onChange={handleFileChange}
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

        {file && uploadProgress && (
          <section className={`mobileUploadStatusPanel ${uploadProgress.status}`}>
            <div className="mobileUploadStatusTop">
              <div>
                <p className="mobileCapsLabel">{getProgressStatusText(uploadProgress)}</p>
                <strong>{uploadProgress.percent}%</strong>
              </div>
              <div className="mobileUploadPercentRing">
                {uploadProgress.percent}%
              </div>
            </div>

            <div className="mobileUploadProgressTrack">
              <span style={{ width: `${Math.min(100, Math.max(0, uploadProgress.percent))}%` }} />
            </div>

            <dl className="mobileUploadStatusGrid">
              <div>
                <dt>{t.fileLabel}</dt>
                <dd>{file.name}</dd>
              </div>
              <div>
                <dt>{t.typeLabel}</dt>
                <dd>{getReadableFileType(file)}</dd>
              </div>
              <div>
                <dt>{t.sizeLabel}</dt>
                <dd>{formatBytes(file.size)}</dd>
              </div>
              <div>
                <dt>{t.uploadedLabel}</dt>
                <dd>{formatBytes(uploadProgress.uploadedBytes)} / {formatBytes(uploadProgress.totalBytes)}</dd>
              </div>
            </dl>
          </section>
        )}

        <label>
          {t.note}
          <textarea
            value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t.placeholder}
          disabled={saving}
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
