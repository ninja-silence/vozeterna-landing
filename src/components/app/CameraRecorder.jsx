"use client";

import { useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const filters = {
  normal: "none",
  warm: "sepia(0.25) saturate(1.25)",
  blackWhite: "grayscale(1)",
  soft: "brightness(1.08) contrast(0.92)",
  cinematic: "contrast(1.18) saturate(0.85)",
};

export default function CameraRecorder({
  language = "en",
  user,
  lovedOneId,
  memoryType = "message_from_person",
  memoryNote = "",
}) {
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoBlob, setVideoBlob] = useState(null);
  const [filter, setFilter] = useState("normal");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const t = {
    en: {
      title: "Camera Recorder",
      text: "Record a video message with simple visual filters.",
      filters: {
        normal: "Normal",
        warm: "Warm",
        blackWhite: "Black & White",
        soft: "Soft",
        cinematic: "Cinematic",
      },
      startCamera: "Start Camera",
      stopCamera: "Stop Camera",
      startVideo: "Start Video Recording",
      stopVideo: "Stop Recording",
      download: "Download video",
      save: "Save to Vault",
      saving: "Saving...",
      saved: "Video memory saved to this legacy vault.",
      consentAlert: "Please complete the consent agreement before recording.",
      cameraAlert: "Start the camera first.",
      signInAlert: "Please sign in before saving.",
      profileAlert: "Please choose a loved one profile before saving.",
      noRecordingAlert: "Please record a video before saving.",
    },
    es: {
      title: "Grabadora de Cámara",
      text: "Graba un mensaje en video con filtros visuales sencillos.",
      filters: {
        normal: "Normal",
        warm: "Cálido",
        blackWhite: "Blanco y Negro",
        soft: "Suave",
        cinematic: "Cinemático",
      },
      startCamera: "Iniciar Cámara",
      stopCamera: "Detener Cámara",
      startVideo: "Iniciar Grabación de Video",
      stopVideo: "Detener Grabación",
      download: "Descargar video",
      save: "Guardar en Bóveda",
      saving: "Guardando...",
      saved: "Recuerdo de video guardado en esta bóveda de legado.",
      consentAlert: "Por favor completa el consentimiento antes de grabar.",
      cameraAlert: "Primero inicia la cámara.",
      signInAlert: "Por favor inicia sesión antes de guardar.",
      profileAlert: "Por favor elige un perfil de ser querido antes de guardar.",
      noRecordingAlert: "Por favor graba un video antes de guardar.",
    },
  }[language];

  async function startCamera() {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setStream(mediaStream);

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  }

  function startVideoRecording() {
    const consent = localStorage.getItem("vozeterna_voice_consent");

    if (!consent) {
      alert(t.consentAlert);
      return;
    }

    if (!stream) {
      alert(t.cameraAlert);
      return;
    }

    setMessage("");
    setVideoUrl("");
    setVideoBlob(null);

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
    };

    recorder.start();
    setRecording(true);
  }

  function stopVideoRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function saveToVault() {
    if (!user) {
      setMessage(t.signInAlert);
      return;
    }

    if (!lovedOneId) {
      setMessage(t.profileAlert);
      return;
    }

    if (!videoBlob) {
      setMessage(t.noRecordingAlert);
      return;
    }

    setSaving(true);
    setMessage("");

    const fileName = `video-memory-${Date.now()}.webm`;
    const filePath = `${user.id}/${lovedOneId}/${fileName}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from("family-media")
      .upload(filePath, videoBlob, {
        contentType: "video/webm",
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      setMessage(storageError.message);
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase.from("media_assets").insert({
      user_id: user.id,
      loved_one_id: lovedOneId,
      file_name: fileName,
      file_path: storageData.path,
      file_type: "video/webm",
      file_size: videoBlob.size,
      title: fileName,
      memory_type: memoryType || "message_from_person",
      memory_note: memoryNote?.trim() || null,
      visibility: "private",
    });

    if (dbError) {
      setMessage(dbError.message);
      setSaving(false);
      return;
    }

    setMessage(t.saved);
    setSaving(false);
  }

  return (
    <div className="recorderCard">
      <h2>{t.title}</h2>
      <p>{t.text}</p>

      <div className="filterRow">
        <button onClick={() => setFilter("normal")}>{t.filters.normal}</button>
        <button onClick={() => setFilter("warm")}>{t.filters.warm}</button>
        <button onClick={() => setFilter("blackWhite")}>{t.filters.blackWhite}</button>
        <button onClick={() => setFilter("soft")}>{t.filters.soft}</button>
        <button onClick={() => setFilter("cinematic")}>{t.filters.cinematic}</button>
      </div>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="cameraPreview"
        style={{ filter: filters[filter] }}
      />

      <div className="buttonRow">
        {!stream ? (
          <button className="appButton" onClick={startCamera}>
            {t.startCamera}
          </button>
        ) : (
          <button className="appButton secondary" onClick={stopCamera}>
            {t.stopCamera}
          </button>
        )}

        {!recording ? (
          <button className="appButton" onClick={startVideoRecording}>
            {t.startVideo}
          </button>
        ) : (
          <button className="appButton danger" onClick={stopVideoRecording}>
            {t.stopVideo}
          </button>
        )}
      </div>

      {videoUrl && (
        <div className="previewBox">
          <video controls src={videoUrl} className="recordedVideo" />

          <div className="buttonRow">
            <a className="appButton secondary" href={videoUrl} download="vozeterna-video-memory.webm">
              {t.download}
            </a>

            <button className="appButton" onClick={saveToVault} disabled={saving}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </div>
      )}

      {message && <div className="successBox">{message}</div>}
    </div>
  );
}