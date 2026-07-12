"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Save,
  Square,
  UploadCloud,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Mobile Recorder",
    title: "Record a voice memory",
    subtitle:
      "Use your phone microphone to capture a blessing, story, prayer, or family memory without leaving the mobile app.",
    permissionTitle: "Microphone permission",
    permissionText:
      "Tap Start Recording and your phone will ask for microphone access. VozEterna only records after you approve.",
    start: "Start recording",
    stop: "Stop",
    reset: "Reset",
    save: "Save to vault",
    saving: "Saving...",
    saved: "Memory saved.",
    permissionError:
      "Microphone permission was blocked or unavailable. Please allow microphone access in your browser settings.",
    uploadInstead: "Upload a file instead",
    scriptLabel: "Memory starter",
    scriptPlaceholder: "Write a few words before recording...",
    note: "This recorder stays inside the mobile experience.",
    noRecording: "Record something first.",
    signIn: "Please sign in before saving.",
  },
  es: {
    label: "Grabadora móvil",
    title: "Graba un recuerdo de voz",
    subtitle:
      "Usa el micrófono de tu teléfono para capturar una bendición, historia, oración o recuerdo familiar sin salir de la app móvil.",
    permissionTitle: "Permiso de micrófono",
    permissionText:
      "Toca Iniciar grabación y tu teléfono pedirá acceso al micrófono. VozEterna solo graba después de tu aprobación.",
    start: "Iniciar grabación",
    stop: "Detener",
    reset: "Reiniciar",
    save: "Guardar en bóveda",
    saving: "Guardando...",
    saved: "Recuerdo guardado.",
    permissionError:
      "El permiso del micrófono fue bloqueado o no está disponible. Permite acceso al micrófono en tu navegador.",
    uploadInstead: "Subir archivo",
    scriptLabel: "Idea para recordar",
    scriptPlaceholder: "Escribe unas palabras antes de grabar...",
    note: "Esta grabadora permanece dentro de la experiencia móvil.",
    noRecording: "Primero graba algo.",
    signIn: "Inicia sesión antes de guardar.",
  },
};

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function MobileRecordPage() {
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [message, setMessage] = useState("");
  const [script, setScript] = useState("");
  const [saving, setSaving] = useState(false);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const t = copy[language] || copy.en;
  const isRecording = status === "recording";
  const hasRecording = Boolean(audioBlob && audioUrl);

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
      cleanupStream();
      clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  function cleanupStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function startTimer() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerRef.current);
  }

  async function startRecording() {
    setMessage("");

    if (!navigator?.mediaDevices?.getUserMedia) {
      setMessage(t.permissionError);
      return;
    }

    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl("");
      setAudioBlob(null);
      chunksRef.current = [];
      setSeconds(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });

        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(url);
        setStatus("ready");
        cleanupStream();
      };

      recorder.start();
      setStatus("recording");
      startTimer();
    } catch (error) {
      console.error("Microphone error:", error);
      setStatus("idle");
      cleanupStream();
      stopTimer();
      setMessage(t.permissionError);
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    stopTimer();
  }

  function resetRecording() {
    stopTimer();
    cleanupStream();

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    chunksRef.current = [];
    setAudioUrl("");
    setAudioBlob(null);
    setSeconds(0);
    setStatus("idle");
    setMessage("");
  }

  async function saveRecording() {
    setMessage("");

    if (!audioBlob) {
      setMessage(t.noRecording);
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setMessage(t.signIn);
      return;
    }

    const fileName = `mobile-voice-${Date.now()}.webm`;
    const filePath = `${user.id}/mobile-recordings/${fileName}`;

    const uploadResult = await supabase.storage
      .from("family-media")
      .upload(filePath, audioBlob, {
        contentType: audioBlob.type || "audio/webm",
        upsert: false,
      });

    if (uploadResult.error) {
      setSaving(false);
      setMessage(uploadResult.error.message);
      return;
    }

    const insertResult = await supabase.from("media_assets").insert({
      user_id: user.id,
      file_name: fileName,
      file_path: filePath,
      file_type: audioBlob.type || "audio/webm",
      file_size: audioBlob.size,
      title: script?.trim() ? script.trim().slice(0, 80) : "Mobile voice memory",
      description: script?.trim() || null,
      visibility: "private",
      memory_type: "voice",
      memory_note: script?.trim() || null,
    });

    setSaving(false);

    if (insertResult.error) {
      setMessage(insertResult.error.message);
      return;
    }

    setMessage(t.saved);
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero mobileRecorderHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="mobileRecorderPanel">
        <div className={isRecording ? "mobileRecorderOrb recording" : "mobileRecorderOrb"}>
          <Mic size={36} strokeWidth={2.2} />
        </div>

        <div className="mobileRecorderTimer">{formatTimer(seconds)}</div>

        <p className="mobileRecorderStatus">
          {isRecording ? "Recording..." : hasRecording ? "Recording ready" : t.permissionText}
        </p>

        <div className="mobileRecorderControls">
          {!isRecording ? (
            <button type="button" onClick={startRecording} className="mobileRecorderPrimary">
              <Mic size={17} />
              {t.start}
            </button>
          ) : (
            <button type="button" onClick={stopRecording} className="mobileRecorderDanger">
              <Square size={17} />
              {t.stop}
            </button>
          )}

          <button type="button" onClick={resetRecording} className="mobileRecorderSecondary">
            <RotateCcw size={17} />
            {t.reset}
          </button>
        </div>

        {audioUrl && (
          <div className="mobileAudioPreview">
            <audio src={audioUrl} controls />
          </div>
        )}
      </section>

      <section className="mobileFormCard">
        <p className="mobileCapsLabel">{t.scriptLabel}</p>
        <textarea
          value={script}
          onChange={(event) => setScript(event.target.value)}
          placeholder={t.scriptPlaceholder}
        />

        <button type="button" onClick={saveRecording} disabled={saving}>
          {saving ? (
            <>
              <Pause size={17} />
              {t.saving}
            </>
          ) : (
            <>
              <Save size={17} />
              {t.save}
            </>
          )}
        </button>

        {message && (
          <p className={message === t.saved ? "mobileSuccessMessage" : "mobileFormMessage"}>
            {message === t.saved && <CheckCircle2 size={16} />}
            <span>{message}</span>
          </p>
        )}

        <p className="mobileFormHelper">{t.note}</p>
      </section>

      <Link href="/mobile/upload" className="mobileActionCard">
        <UploadCloud size={20} />
        <strong>{t.uploadInstead}</strong>
      </Link>
    </section>
  );
}