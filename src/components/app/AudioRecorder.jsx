"use client";

import { useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AudioRecorder({
  language = "en",
  user,
  lovedOneId,
  memoryType = "voice_of_person",
  memoryNote = "",
}) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const t = {
    en: {
      title: "Audio Recorder",
      text: "Record a voice memory, blessing, prayer, story, or message.",
      start: "Start Audio Recording",
      stop: "Stop Recording",
      download: "Download audio",
      save: "Save to Vault",
      saving: "Saving...",
      saved: "Audio memory saved to this legacy vault.",
      consentAlert: "Please complete the consent agreement before recording.",
      signInAlert: "Please sign in before saving.",
      profileAlert: "Please choose a loved one profile before saving.",
      noRecordingAlert: "Please record audio before saving.",
    },
    es: {
      title: "Grabadora de Audio",
      text: "Graba un recuerdo de voz, bendición, oración, historia o mensaje.",
      start: "Iniciar Grabación de Audio",
      stop: "Detener Grabación",
      download: "Descargar audio",
      save: "Guardar en Bóveda",
      saving: "Guardando...",
      saved: "Recuerdo de audio guardado en esta bóveda de legado.",
      consentAlert: "Por favor completa el consentimiento antes de grabar.",
      signInAlert: "Por favor inicia sesión antes de guardar.",
      profileAlert: "Por favor elige un perfil de ser querido antes de guardar.",
      noRecordingAlert: "Por favor graba un audio antes de guardar.",
    },
  }[language];

  async function startRecording() {
    const consent = localStorage.getItem("vozeterna_voice_consent");

    if (!consent) {
      alert(t.consentAlert);
      return;
    }

    setMessage("");
    setAudioUrl("");
    setAudioBlob(null);

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
      setAudioBlob(blob);
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

  async function saveToVault() {
    if (!user) {
      setMessage(t.signInAlert);
      return;
    }

    if (!lovedOneId) {
      setMessage(t.profileAlert);
      return;
    }

    if (!audioBlob) {
      setMessage(t.noRecordingAlert);
      return;
    }

    setSaving(true);
    setMessage("");

    const fileName = `voice-memory-${Date.now()}.webm`;
    const filePath = `${user.id}/${lovedOneId}/${fileName}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from("family-media")
      .upload(filePath, audioBlob, {
        contentType: "audio/webm",
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
      file_type: "audio/webm",
      file_size: audioBlob.size,
      title: fileName,
      memory_type: memoryType || "voice_of_person",
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

          <div className="buttonRow">
            <a className="appButton secondary" href={audioUrl} download="vozeterna-voice-memory.webm">
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