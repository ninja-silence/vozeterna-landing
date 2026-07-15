"use client";

import { useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { cleanupUploadedFile } from "../../lib/storageCleanup";

const copy = {
  en: {
    eyebrow: "Audio Recorder",
    title: "Record a voice memory",
    text: "Save a blessing, prayer, story, message, or voice note directly to the private vault.",
    start: "Start audio recording",
    stop: "Stop recording",
    save: "Save voice memory",
    saving: "Saving...",
    listen: "Preview recording",
    ready: "Recording ready. Listen before saving.",
    saved: "Voice memory saved successfully.",
    noUser: "Please sign in before recording.",
    noLovedOne: "Please choose a loved one profile before saving.",
    noRecording: "Please record audio first.",
    permission:
      "Microphone access was blocked or unavailable. Please allow microphone permission and try again.",
  },
  es: {
    eyebrow: "Grabadora de audio",
    title: "Graba un recuerdo de voz",
    text: "Guarda una bendición, oración, historia, mensaje o nota de voz directamente en la bóveda privada.",
    start: "Iniciar grabación de audio",
    stop: "Detener grabación",
    save: "Guardar recuerdo de voz",
    saving: "Guardando...",
    listen: "Escuchar grabación",
    ready: "Grabación lista. Escúchala antes de guardarla.",
    saved: "Recuerdo de voz guardado correctamente.",
    noUser: "Por favor inicia sesión antes de grabar.",
    noLovedOne: "Por favor elige un perfil de ser querido antes de guardar.",
    noRecording: "Primero graba un audio.",
    permission:
      "El acceso al micrófono fue bloqueado o no está disponible. Permite el micrófono e intenta otra vez.",
  },
};

export default function AudioRecorder({
  language = "en",
  user,
  lovedOneId,
  memoryType,
  memoryNote,
}) {
  const t = copy[language] || copy.en;

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function startRecording() {
    setMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(url);
        setMessage(t.ready);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      setMessage(t.permission);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  async function saveRecording() {
    setMessage("");

    if (!user) {
      setMessage(t.noUser);
      return;
    }

    if (!lovedOneId) {
      setMessage(t.noLovedOne);
      return;
    }

    if (!audioBlob) {
      setMessage(t.noRecording);
      return;
    }

    setSaving(true);

    const fileName = `voice-memory-${Date.now()}.webm`;
    const filePath = `${user.id}/${lovedOneId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("family-media")
      .upload(filePath, audioBlob, {
        contentType: "audio/webm",
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
      file_type: "audio/webm",
      file_size: audioBlob.size,
      memory_type: memoryType || "voice_of_person",
      memory_note: memoryNote?.trim() || null,
      visibility: "private",
      show_on_memorial: false,
    });

    if (insertError) {
      await cleanupUploadedFile(supabase, "family-media", filePath, "failed audio upload");
      setMessage(insertError.message);
      setSaving(false);
      return;
    }

    setMessage(t.saved);
    setAudioBlob(null);
    setAudioUrl("");
    setSaving(false);
  }

  return (
    <section className="recorderPanel audioRecorderPanel">
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

      {audioUrl && (
        <div className="audioPreviewBox">
          <p className="appEyebrow">{t.listen}</p>
          <audio controls src={audioUrl} />
        </div>
      )}

      {message && <div className="successBox recorderMessage">{message}</div>}

      <div className="buttonRow">
        {!recording ? (
          <button type="button" className="appButton" onClick={startRecording}>
            {t.start}
          </button>
        ) : (
          <button type="button" className="appButton dangerButton" onClick={stopRecording}>
            {t.stop}
          </button>
        )}

        {audioBlob && (
          <button type="button" className="appButton secondary" onClick={saveRecording} disabled={saving}>
            {saving ? t.saving : t.save}
          </button>
        )}
      </div>
    </section>
  );
}
