"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  Mic,
  Pause,
  RotateCcw,
  Save,
  Square,
  UploadCloud,
  Video,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { saveMobileMemoryToV2 } from "../../../lib/mobileVault";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Mobile Recorder",
    title: "Record a memory",
    subtitle:
      "Use your phone microphone or selfie camera to capture a blessing, story, prayer, or family memory without leaving the mobile app.",
    voiceTab: "Voice",
    videoTab: "Selfie video",
    micPermission:
      "Tap Start Voice and your phone will ask for microphone access. VozEterna only records after you approve.",
    cameraPermission:
      "Tap Start Selfie Video and your phone will ask for camera and microphone access.",
    startVoice: "Start voice",
    startVideo: "Start selfie video",
    stop: "Stop",
    reset: "Reset",
    save: "Save to vault",
    saving: "Saving...",
    saved: "Memory saved.",
    permissionError:
      "Permission was blocked or unavailable. Please allow microphone/camera access in your browser settings.",
    uploadInstead: "Upload a file instead",
    scriptLabel: "Memory note",
    scriptPlaceholder: "Write a few words about this memory...",
    note: "This recorder stays inside the mobile experience.",
    noRecording: "Record something first.",
    signIn: "Please sign in before saving.",
    ready: "Recording ready",
    recording: "Recording...",
  },
  es: {
    label: "Grabadora móvil",
    title: "Graba un recuerdo",
    subtitle:
      "Usa el micrófono o cámara frontal de tu teléfono para capturar una bendición, historia, oración o recuerdo familiar sin salir de la app móvil.",
    voiceTab: "Voz",
    videoTab: "Video selfie",
    micPermission:
      "Toca Iniciar voz y tu teléfono pedirá acceso al micrófono. VozEterna solo graba después de tu aprobación.",
    cameraPermission:
      "Toca Iniciar video selfie y tu teléfono pedirá acceso a cámara y micrófono.",
    startVoice: "Iniciar voz",
    startVideo: "Iniciar video selfie",
    stop: "Detener",
    reset: "Reiniciar",
    save: "Guardar en bóveda",
    saving: "Guardando...",
    saved: "Recuerdo guardado.",
    permissionError:
      "El permiso fue bloqueado o no está disponible. Permite acceso al micrófono/cámara en tu navegador.",
    uploadInstead: "Subir archivo",
    scriptLabel: "Nota del recuerdo",
    scriptPlaceholder: "Escribe unas palabras sobre este recuerdo...",
    note: "Esta grabadora permanece dentro de la experiencia móvil.",
    noRecording: "Primero graba algo.",
    signIn: "Inicia sesión antes de guardar.",
    ready: "Grabación lista",
    recording: "Grabando...",
  },
};

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function pickSupportedMime(kind) {
  if (kind === "video") {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
      return "video/webm;codecs=vp9,opus";
    }

    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
      return "video/webm;codecs=vp8,opus";
    }

    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm")) {
      return "video/webm";
    }

    return "";
  }

  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }

  return "";
}

export default function MobileRecordPage() {
  const [language, setLanguage] = useState("en");
  const [mode, setMode] = useState("voice");
  const [status, setStatus] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [recordingKind, setRecordingKind] = useState("voice");
  const [message, setMessage] = useState("");
  const [script, setScript] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const t = copy[language] || copy.en;
  const isRecording = status === "recording";
  const hasRecording = Boolean(recordingBlob && recordingUrl);

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
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && streamRef.current && mode === "video" && isRecording) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [mode, isRecording]);

  function cleanupStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setPreviewActive(false);
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

  function resetRecording() {
    stopTimer();

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    cleanupStream();

    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }

    chunksRef.current = [];
    setRecordingUrl("");
    setRecordingBlob(null);
    setSeconds(0);
    setStatus("idle");
    setMessage("");
  }

  async function startRecording(kind) {
    setMode(kind);
    setMessage("");

    if (!navigator?.mediaDevices?.getUserMedia) {
      setMessage(t.permissionError);
      return;
    }

    try {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }

      setRecordingUrl("");
      setRecordingBlob(null);
      setRecordingKind(kind);
      chunksRef.current = [];
      setSeconds(0);

      const constraints =
        kind === "video"
          ? {
              audio: true,
              video: {
                facingMode: "user",
                width: { ideal: 720 },
                height: { ideal: 1280 },
              },
            }
          : {
              audio: true,
              video: false,
            };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (kind === "video" && videoRef.current) {
        videoRef.current.srcObject = stream;
        setPreviewActive(true);
      }

      const mimeType = pickSupportedMime(kind);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fallbackType = kind === "video" ? "video/webm" : "audio/webm";
        const blob = new Blob(chunksRef.current, {
          type: mimeType || fallbackType,
        });

        const url = URL.createObjectURL(blob);

        setRecordingBlob(blob);
        setRecordingUrl(url);
        setRecordingKind(kind);
        setStatus("ready");
        cleanupStream();
      };

      recorder.start();
      setStatus("recording");
      startTimer();
    } catch (error) {
      console.error("Recorder permission error:", error);
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

  async function saveRecording() {
    setMessage("");

    if (!recordingBlob) {
      setMessage(t.noRecording);
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

      const extension = recordingKind === "video" ? "webm" : "webm";
      const fileName = `mobile-${recordingKind}-${Date.now()}.${extension}`;

      const file = new File([recordingBlob], fileName, {
        type: recordingBlob.type || (recordingKind === "video" ? "video/webm" : "audio/webm"),
      });

      await saveMobileMemoryToV2({
        supabase,
        user,
        file,
        title:
          script?.trim()
            ? script.trim().slice(0, 80)
            : recordingKind === "video"
              ? "Mobile selfie video memory"
              : "Mobile voice memory",
        note: script,
        folder: recordingKind === "video" ? "mobile-videos" : "mobile-recordings",
        forcedType: recordingKind === "video" ? "video" : "audio",
      });

      setMessage(t.saved);
    } catch (error) {
      setMessage(error.message || "Could not save memory.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero mobileRecorderHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="mobileRecorderPanel">
        <div className="mobileRecorderModeTabs">
          <button
            type="button"
            className={mode === "voice" ? "active" : ""}
            onClick={() => {
              if (!isRecording) setMode("voice");
            }}
          >
            <Mic size={16} />
            {t.voiceTab}
          </button>

          <button
            type="button"
            className={mode === "video" ? "active" : ""}
            onClick={() => {
              if (!isRecording) setMode("video");
            }}
          >
            <Camera size={16} />
            {t.videoTab}
          </button>
        </div>

        {mode === "video" ? (
          <div className={previewActive ? "mobileCameraPreview active" : "mobileCameraPreview"}>
            {isRecording ? (
              <video ref={videoRef} autoPlay playsInline muted />
            ) : recordingKind === "video" && recordingUrl ? (
              <video src={recordingUrl} controls playsInline />
            ) : (
              <div>
                <Camera size={36} />
                <span>{t.cameraPermission}</span>
              </div>
            )}
          </div>
        ) : (
          <div className={isRecording ? "mobileRecorderOrb recording" : "mobileRecorderOrb"}>
            <Mic size={36} strokeWidth={2.2} />
          </div>
        )}

        <div className="mobileRecorderTimer">{formatTimer(seconds)}</div>

        <p className="mobileRecorderStatus">
          {isRecording
            ? t.recording
            : hasRecording
              ? t.ready
              : mode === "video"
                ? t.cameraPermission
                : t.micPermission}
        </p>

        <div className="mobileRecorderControls">
          {!isRecording ? (
            <button
              type="button"
              onClick={() => startRecording(mode)}
              className="mobileRecorderPrimary"
            >
              {mode === "video" ? <Video size={17} /> : <Mic size={17} />}
              {mode === "video" ? t.startVideo : t.startVoice}
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

        {recordingKind === "voice" && recordingUrl && (
          <div className="mobileAudioPreview">
            <audio src={recordingUrl} controls />
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