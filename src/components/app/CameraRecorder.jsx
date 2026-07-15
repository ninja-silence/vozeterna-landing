"use client";

import { useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { cleanupUploadedFile } from "../../lib/storageCleanup";

const copy = {
  en: {
    eyebrow: "Camera Recorder",
    title: "Record a video memory",
    text: "Capture a message, story, blessing, prayer, or family moment with your camera.",
    startCamera: "Start camera",
    stopCamera: "Stop camera",
    startRecording: "Start video recording",
    stopRecording: "Stop video recording",
    save: "Save video memory",
    saving: "Saving...",
    preview: "Preview video",
    ready: "Video recording ready. Preview it before saving.",
    saved: "Video memory saved successfully.",
    noUser: "Please sign in before recording.",
    noLovedOne: "Please choose a loved one profile before saving.",
    noRecording: "Please record a video first.",
    permission:
      "Camera or microphone access was blocked or unavailable. Please allow permission and try again.",
    filters: {
      normal: "Normal",
      warm: "Warm",
      bw: "Black & White",
      soft: "Soft",
      cinematic: "Cinematic",
    },
  },
  es: {
    eyebrow: "Grabadora de cámara",
    title: "Graba un recuerdo en video",
    text: "Captura un mensaje, historia, bendición, oración o momento familiar con tu cámara.",
    startCamera: "Iniciar cámara",
    stopCamera: "Detener cámara",
    startRecording: "Iniciar grabación de video",
    stopRecording: "Detener grabación de video",
    save: "Guardar recuerdo en video",
    saving: "Guardando...",
    preview: "Vista previa del video",
    ready: "Grabación de video lista. Revísala antes de guardarla.",
    saved: "Recuerdo en video guardado correctamente.",
    noUser: "Por favor inicia sesión antes de grabar.",
    noLovedOne: "Por favor elige un perfil de ser querido antes de guardar.",
    noRecording: "Primero graba un video.",
    permission:
      "El acceso a la cámara o micrófono fue bloqueado o no está disponible. Permite el acceso e intenta otra vez.",
    filters: {
      normal: "Normal",
      warm: "Cálido",
      bw: "Blanco y negro",
      soft: "Suave",
      cinematic: "Cinemático",
    },
  },
};

const filterStyles = {
  normal: "none",
  warm: "sepia(0.18) saturate(1.18) contrast(1.03)",
  bw: "grayscale(1) contrast(1.08)",
  soft: "brightness(1.04) saturate(0.92)",
  cinematic: "contrast(1.12) saturate(0.9) brightness(0.92)",
};

export default function CameraRecorder({
  language = "en",
  user,
  lovedOneId,
  memoryType,
  memoryNote,
}) {
  const t = copy[language] || copy.en;

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [cameraOn, setCameraOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function startCamera() {
    setMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
    } catch {
      setMessage(t.permission);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setRecording(false);
  }

  function startRecording() {
    setMessage("");

    if (!streamRef.current) {
      startCamera();
      return;
    }

    chunksRef.current = [];

    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      setVideoBlob(blob);
      setVideoUrl(url);
      setMessage(t.ready);
    };

    mediaRecorder.start();
    setRecording(true);
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  async function saveVideo() {
    setMessage("");

    if (!user) {
      setMessage(t.noUser);
      return;
    }

    if (!lovedOneId) {
      setMessage(t.noLovedOne);
      return;
    }

    if (!videoBlob) {
      setMessage(t.noRecording);
      return;
    }

    setSaving(true);

    const fileName = `video-memory-${Date.now()}.webm`;
    const filePath = `${user.id}/${lovedOneId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("family-media")
      .upload(filePath, videoBlob, {
        contentType: "video/webm",
      });

    if (uploadError) {
      setMessage(uploadError.message);
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("media_assets").insert({
      user_id: user.id,
      loved_one_id: lovedOneId,
      file_name: fileName,
      file_path: filePath,
      file_type: "video/webm",
      file_size: videoBlob.size,
      memory_type: memoryType || "message_from_person",
      memory_note: memoryNote?.trim() || null,
      visibility: "private",
      show_on_memorial: false,
    });

    if (insertError) {
      await cleanupUploadedFile(supabase, "family-media", filePath, "failed video upload");
      setMessage(insertError.message);
      setSaving(false);
      return;
    }

    setMessage(t.saved);
    setVideoBlob(null);
    setVideoUrl("");
    setSaving(false);
  }

  return (
    <section className="recorderPanel cameraRecorderPanel">
      <div className="recorderPanelHeader">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h2>{t.title}</h2>
          <p>{t.text}</p>
        </div>

        <div className={recording ? "recorderPulse active" : "recorderPulse"}>
          <span />
        </div>
      </div>

      <div className="cameraFilterRow">
        <button
          type="button"
          className={selectedFilter === "normal" ? "active" : ""}
          onClick={() => setSelectedFilter("normal")}
        >
          {t.filters.normal}
        </button>

        <button
          type="button"
          className={selectedFilter === "warm" ? "active" : ""}
          onClick={() => setSelectedFilter("warm")}
        >
          {t.filters.warm}
        </button>

        <button
          type="button"
          className={selectedFilter === "bw" ? "active" : ""}
          onClick={() => setSelectedFilter("bw")}
        >
          {t.filters.bw}
        </button>

        <button
          type="button"
          className={selectedFilter === "soft" ? "active" : ""}
          onClick={() => setSelectedFilter("soft")}
        >
          {t.filters.soft}
        </button>

        <button
          type="button"
          className={selectedFilter === "cinematic" ? "active" : ""}
          onClick={() => setSelectedFilter("cinematic")}
        >
          {t.filters.cinematic}
        </button>
      </div>

      <div className="cameraPreviewShell">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="cameraPreviewVideo"
          style={{ filter: filterStyles[selectedFilter] }}
        />
      </div>

      {videoUrl && (
        <div className="videoPreviewBox">
          <p className="appEyebrow">{t.preview}</p>
          <video controls src={videoUrl} />
        </div>
      )}

      {message && <div className="successBox recorderMessage">{message}</div>}

      <div className="buttonRow">
        {!cameraOn ? (
          <button type="button" className="appButton" onClick={startCamera}>
            {t.startCamera}
          </button>
        ) : (
          <button type="button" className="appButton secondary" onClick={stopCamera}>
            {t.stopCamera}
          </button>
        )}

        {cameraOn &&
          (!recording ? (
            <button type="button" className="appButton" onClick={startRecording}>
              {t.startRecording}
            </button>
          ) : (
            <button type="button" className="appButton dangerButton" onClick={stopRecording}>
              {t.stopRecording}
            </button>
          ))}

        {videoBlob && (
          <button type="button" className="appButton secondary" onClick={saveVideo} disabled={saving}>
            {saving ? t.saving : t.save}
          </button>
        )}
      </div>
    </section>
  );
}
