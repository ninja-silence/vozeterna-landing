"use client";

import { useRef, useState } from "react";

const filters = {
  normal: "none",
  warm: "sepia(0.25) saturate(1.25)",
  blackWhite: "grayscale(1)",
  soft: "brightness(1.08) contrast(0.92)",
  cinematic: "contrast(1.18) saturate(0.85)",
};

export default function CameraRecorder({ language = "en" }) {
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [filter, setFilter] = useState("normal");

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
      consentAlert: "Please complete the consent agreement before recording.",
      cameraAlert: "Start the camera first.",
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
      consentAlert: "Por favor completa el consentimiento antes de grabar.",
      cameraAlert: "Primero inicia la cámara.",
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

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    };

    recorder.start();
    setRecording(true);
  }

  function stopVideoRecording() {
    recorderRef.current?.stop();
    setRecording(false);
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
          <a className="textLink" href={videoUrl} download="vozeterna-video-memory.webm">
            {t.download}
          </a>
        </div>
      )}
    </div>
  );
}