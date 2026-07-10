"use client";

import { useRef, useState } from "react";

export default function AudioRecorder({ language = "en" }) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");

  const t = {
    en: {
      title: "Audio Recorder",
      text: "Record a voice memory, blessing, prayer, story, or message.",
      start: "Start Audio Recording",
      stop: "Stop Recording",
      download: "Download audio",
      consentAlert: "Please complete the consent agreement before recording.",
    },
    es: {
      title: "Grabadora de Audio",
      text: "Graba un recuerdo de voz, bendición, oración, historia o mensaje.",
      start: "Iniciar Grabación de Audio",
      stop: "Detener Grabación",
      download: "Descargar audio",
      consentAlert: "Por favor completa el consentimiento antes de grabar.",
    },
  }[language];

  async function startRecording() {
    const consent = localStorage.getItem("vozeterna_voice_consent");

    if (!consent) {
      alert(t.consentAlert);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="recorderCard">
      <h2>{t.title}</h2>
      <p>{t.text}</p>

      <div className="buttonRow">
        {!recording ? (
          <button className="appButton" onClick={startRecording}>
            {t.start}
          </button>
        ) : (
          <button className="appButton danger" onClick={stopRecording}>
            {t.stop}
          </button>
        )}
      </div>

      {audioUrl && (
        <div className="previewBox">
          <audio controls src={audioUrl} />
          <a className="textLink" href={audioUrl} download="vozeterna-voice-memory.webm">
            {t.download}
          </a>
        </div>
      )}
    </div>
  );
}