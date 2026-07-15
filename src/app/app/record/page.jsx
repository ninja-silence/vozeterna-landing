"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CameraRecorder from "../../../components/app/CameraRecorder";
import { supabase } from "../../../lib/supabaseClient";
import { getRelationshipLabel } from "../../../lib/relationshipLabels";
import { cleanupUploadedFile } from "../../../lib/storageCleanup";
import { useAppLanguage } from "../../../lib/useAppLanguage";

const copy = {
  en: {
    step: "Record Memories",
    title: "Record Voice & Video Memories",
    subtitle:
      "Capture and preserve voice, video, stories, and messages for your family to treasure forever.",
    back: "Back to dashboard",
    signInTitle: "Please sign in",
    signInText: "You need to sign in before recording private family memories.",
    signIn: "Sign in",
    noConsentTitle: "Consent required",
    noConsentText:
      "Before recording voice or video memories, please complete the consent and signature agreement.",
    completeConsent: "Complete consent",
    noProfilesTitle: "Create a loved one profile first",
    noProfilesText:
      "Before recording memories, create a profile for the person these memories belong to.",
    createProfile: "Create profile",
    consentSigned: "Consent signed",
    vaultSecured: "Vault secured",
    recordVoice: "Record Voice Memory",
    recordVideo: "Record Video Memory",
    voiceMemory: "Voice Memory",
    videoMemory: "Video Memory",
    voiceTitle: "Record a voice memory",
    voiceText: "Ready to record an audio message for your private vault.",
    videoTitle: "Record a video memory",
    videoText: "Set up your camera to capture a video memory.",
    startVoice: "Start Voice Recording",
    stopVoice: "Stop Recording",
    saveVoice: "Save Voice Memory",
    discardVoice: "Discard",
    saved: "Voice memory saved.",
    saving: "Saving...",
    noRecording: "Record something first.",
    scriptLabel: "Reading sheet",
    scriptPlaceholder: "Write what you want to say before recording. Example: a blessing, prayer, favorite memory, advice, or message to your family.",
    saveScriptLabel: "Save this text with the memory",
    nextTitle: "Next steps after recording",
    nextSteps: [
      "Review new recordings",
      "Tag loved ones after they have a profile",
      "Save memory",
      "Approve for public page",
    ],
    who: "Who is this memory for?",
    kind: "What kind of memory is this?",
    note: "Optional memory note",
    notePlaceholder:
      "Example: Mom's blessing, Dad's advice, Grandma's prayer, or a special family message.",
    types: {
      photo_of_person: "Photo of this person",
      photo_from_person: "Photo from this person",
      story_about_person: "Story about this person",
      message_from_person: "Message from this person",
      voice_of_person: "Voice of this person",
      family_memory: "Family memory connected to this person",
      document_or_keepsake: "Document or keepsake",
    },
  },
  es: {
    step: "Grabar recuerdos",
    title: "Grabar recuerdos de voz y video",
    subtitle:
      "Captura y preserva voz, video, historias y mensajes para que tu familia los atesore para siempre.",
    back: "Volver al inicio",
    signInTitle: "Por favor inicia sesión",
    signInText: "Necesitas iniciar sesión antes de grabar recuerdos familiares privados.",
    signIn: "Iniciar sesión",
    noConsentTitle: "Consentimiento requerido",
    noConsentText:
      "Antes de grabar recuerdos de voz o video, completa el consentimiento y la firma.",
    completeConsent: "Completar consentimiento",
    noProfilesTitle: "Primero crea un perfil de ser querido",
    noProfilesText:
      "Antes de grabar recuerdos, crea un perfil para la persona a la que pertenecen estos recuerdos.",
    createProfile: "Crear perfil",
    consentSigned: "Consentimiento firmado",
    vaultSecured: "Bóveda protegida",
    recordVoice: "Grabar recuerdo de voz",
    recordVideo: "Grabar recuerdo en video",
    voiceMemory: "Recuerdo de voz",
    videoMemory: "Recuerdo en video",
    voiceTitle: "Graba un recuerdo de voz",
    voiceText: "Listo para grabar un mensaje de audio para tu bóveda privada.",
    videoTitle: "Graba un recuerdo en video",
    videoText: "Configura tu cámara para capturar un recuerdo en video.",
    startVoice: "Iniciar grabación de voz",
    stopVoice: "Detener grabación",
    saveVoice: "Guardar recuerdo de voz",
    discardVoice: "Descartar",
    saved: "Recuerdo de voz guardado.",
    saving: "Guardando...",
    noRecording: "Primero graba algo.",
    scriptLabel: "Hoja de lectura",
    scriptPlaceholder: "Escribe lo que quieres decir antes de grabar. Ejemplo: una bendición, oración, recuerdo favorito, consejo o mensaje para tu familia.",
    saveScriptLabel: "Guardar este texto con el recuerdo",
    nextTitle: "Siguientes pasos después de grabar",
    nextSteps: [
      "Revisar nuevas grabaciones",
      "Etiquetar seres queridos después de que tengan perfil",
      "Guardar recuerdo",
      "Aprobar para página pública",
    ],
    who: "¿Para quién es este recuerdo?",
    kind: "¿Qué tipo de recuerdo es?",
    note: "Nota opcional del recuerdo",
    notePlaceholder:
      "Ejemplo: La bendición de mamá, el consejo de papá, la oración de abuela o un mensaje familiar especial.",
    types: {
      photo_of_person: "Foto de esta persona",
      photo_from_person: "Foto de esta persona o guardada por ella",
      story_about_person: "Historia sobre esta persona",
      message_from_person: "Mensaje de esta persona",
      voice_of_person: "Voz de esta persona",
      family_memory: "Recuerdo familiar conectado a esta persona",
      document_or_keepsake: "Documento o recuerdo especial",
    },
  },
};

function GateCard({ eyebrow, title, text, primaryHref, primaryLabel, secondaryHref, secondaryLabel }) {
  return (
    <main className="appShell recordMockPage">
      <section className="recordGateCard">
        <p className="appEyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>

        <div className="buttonRow">
          <Link href={primaryHref} className="appButton">
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className="appButton secondary">
            {secondaryLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}

function TealWaveform({ active }) {
  const bars = Array.from({ length: 46 }, (_, index) => index);

  return (
    <div className={active ? "tealWaveform active" : "tealWaveform"}>
      {bars.map((bar) => (
        <span key={bar} style={{ "--bar-index": bar }} />
      ))}
    </div>
  );
}

function VoiceRecorderCard({
  t,
  user,
  lovedOneId,
  memoryType,
  memoryNote,
  language,
}) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [scriptText, setScriptText] = useState("");
  const [saveScript, setSaveScript] = useState(true);

  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recordingUrl]);

  async function startRecording() {
    setMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : undefined,
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setRecordingBlob(blob);
        setRecordingUrl(url);
        setIsRecording(false);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      setMessage(error.message || "Microphone access was blocked.");
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  async function saveVoiceMemory() {
    if (!recordingBlob) {
      setMessage(t.noRecording);
      return;
    }

    setSaving(true);
    setMessage("");

    const finalMemoryNote = [
      memoryNote,
      saveScript && scriptText.trim() ? scriptText.trim() : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const fileName = `voice-memory-${Date.now()}.webm`;
    const filePath = `${user.id}/${lovedOneId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("family-media")
      .upload(filePath, recordingBlob, {
        contentType: recordingBlob.type || "audio/webm",
        upsert: false,
      });

    if (uploadError) {
      setSaving(false);
      setMessage(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from("media_assets").insert({
      user_id: user.id,
      loved_one_id: lovedOneId,
      file_name: fileName,
      file_path: filePath,
      file_type: recordingBlob.type || "audio/webm",
      file_size: recordingBlob.size,
      title: language === "es" ? "Recuerdo de voz" : "Voice memory",
      description: finalMemoryNote || null,
      visibility: "private",
      memory_type: memoryType,
      memory_note: finalMemoryNote || null,
      show_on_memorial: false,
    });

    setSaving(false);

    if (insertError) {
      await cleanupUploadedFile(supabase, "family-media", filePath, "failed voice recording upload");
      setMessage(insertError.message);
      return;
    }

    setMessage(t.saved);

    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }

    setRecordingBlob(null);
    setRecordingUrl("");
  }

  function resetRecording() {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }

    setRecordingBlob(null);
    setRecordingUrl("");
    setMessage("");
  }

  return (
    <div className="recordMockInner">
      <div className="recordWaveBox">
        <TealWaveform active={isRecording} />
        <div className="recordWaveDots">
          <span />
          <span />
          <span />
        </div>
      </div>

      <p>{t.voiceText}</p>

      {recordingUrl && (
        <audio className="recordAudioPreview" src={recordingUrl} controls />
      )}

      <div className="recordControlRow">
        {!isRecording ? (
          <button type="button" className="recordTealButton" onClick={startRecording}>
            <span>🎙</span>
            {t.startVoice}
          </button>
        ) : (
          <button type="button" className="recordTealButton" onClick={stopRecording}>
            <span>■</span>
            {t.stopVoice}
          </button>
        )}

        {recordingBlob && (
          <>
            <button
              type="button"
              className="recordTealButton secondary"
              onClick={saveVoiceMemory}
              disabled={saving}
            >
              {saving ? t.saving : t.saveVoice}
            </button>

            <button
              type="button"
              className="recordTealButton ghost"
              onClick={resetRecording}
              disabled={saving}
            >
              {t.discardVoice}
            </button>
          </>
        )}
      </div>

      <div className="recordScriptSheet">
        <label htmlFor="voiceScript">{t.scriptLabel}</label>
        <textarea
          id="voiceScript"
          value={scriptText}
          onChange={(event) => setScriptText(event.target.value)}
          placeholder={t.scriptPlaceholder}
          rows={7}
        />

        <label className="recordScriptToggle">
          <input
            type="checkbox"
            checked={saveScript}
            onChange={(event) => setSaveScript(event.target.checked)}
          />
          <span>{t.saveScriptLabel}</span>
        </label>
      </div>

      {message && <p className="recordMockMessage">{message}</p>}
    </div>
  );
}

export default function RecordPage() {
  const language = useAppLanguage();
  const t = copy[language] || copy.en;

  const [user, setUser] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [lovedOnes, setLovedOnes] = useState([]);
  const [selectedLovedOneId, setSelectedLovedOneId] = useState("");
  const [memoryType, setMemoryType] = useState("voice_of_person");
  const [memoryNote, setMemoryNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecordSetup() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data: consentData } = await supabase
        .from("consent_records")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("accepted", true)
        .order("accepted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setHasConsent(Boolean(consentData?.id));

      const { data: profilesData } = await supabase
        .from("loved_ones")
        .select("id, full_name, relationship, relationship_type")
        .order("created_at", { ascending: false });

      const profiles = profilesData || [];
      setLovedOnes(profiles);

      if (profiles.length) {
        const params = new URLSearchParams(window.location.search);
        const requestedLovedOneId = params.get("lovedOneId");
        const profileExists = profiles.some((profile) => profile.id === requestedLovedOneId);

        setSelectedLovedOneId(profileExists ? requestedLovedOneId : profiles[0].id);
      }

      setLoading(false);
    }

    loadRecordSetup();
  }, []);

  const typeOptions = useMemo(() => Object.entries(t.types), [t.types]);

  function relationshipLabel(profile) {
    const raw = profile.relationship_type || profile.relationship;
    return raw ? getRelationshipLabel(raw, language) || raw : "";
  }

  if (loading) {
    return (
      <main className="appShell recordMockPage">
        <section className="recordGateCard">
          <p className="appEyebrow">{t.step}</p>
          <h1>{language === "es" ? "Cargando..." : "Loading..."}</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <GateCard
        eyebrow={t.step}
        title={t.signInTitle}
        text={t.signInText}
        primaryHref="/app/login"
        primaryLabel={t.signIn}
        secondaryHref="/app"
        secondaryLabel={t.back}
      />
    );
  }

  if (!hasConsent) {
    return (
      <GateCard
        eyebrow={t.step}
        title={t.noConsentTitle}
        text={t.noConsentText}
        primaryHref="/app/consent"
        primaryLabel={t.completeConsent}
        secondaryHref="/app"
        secondaryLabel={t.back}
      />
    );
  }

  if (!lovedOnes.length) {
    return (
      <GateCard
        eyebrow={t.step}
        title={t.noProfilesTitle}
        text={t.noProfilesText}
        primaryHref="/app/loved-ones/new"
        primaryLabel={t.createProfile}
        secondaryHref="/app"
        secondaryLabel={t.back}
      />
    );
  }

  return (
    <main className="appShell recordMockPage">
      <section className="recordMockHero">
        <p className="appEyebrow">{t.step}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>

        <div className="recordMockPills">
          <span>
            <strong>🔒</strong>
            {t.consentSigned}
          </span>
          <span>
            <strong>🛡</strong>
            {t.vaultSecured}
          </span>
        </div>
      </section>

      <section className="recordMockPrepare">
        <label>
          <span>{t.who}</span>
          <select
            value={selectedLovedOneId}
            onChange={(event) => setSelectedLovedOneId(event.target.value)}
          >
            {lovedOnes.map((profile) => {
              const label = relationshipLabel(profile);

              return (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}{label ? ` — ${label}` : ""}
                </option>
              );
            })}
          </select>
        </label>

        <label>
          <span>{t.kind}</span>
          <select
            value={memoryType}
            onChange={(event) => setMemoryType(event.target.value)}
          >
            {typeOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{t.note}</span>
          <textarea
            rows={3}
            value={memoryNote}
            onChange={(event) => setMemoryNote(event.target.value)}
            placeholder={t.notePlaceholder}
          />
        </label>
      </section>

      <section className="recordMockCards">
        <article className="recordMockCard" id="voice-recorder">
          <h2>{t.voiceMemory}</h2>
          <div className="recordMockDivider" />
          <h3>{t.voiceTitle}</h3>
          <p>{t.voiceText}</p>

          <VoiceRecorderCard
            t={t}
            user={user}
            lovedOneId={selectedLovedOneId}
            memoryType={memoryType}
            memoryNote={memoryNote}
            language={language}
          />
        </article>

        <article className="recordMockCard" id="video-recorder">
          <h2>{t.videoMemory}</h2>
          <div className="recordMockDivider" />
          <h3>{t.videoTitle}</h3>
          <p>{t.videoText}</p>

          <div className="recordVideoWrap">
            <CameraRecorder
              language={language}
              user={user}
              lovedOneId={selectedLovedOneId}
              memoryType={memoryType}
              memoryNote={memoryNote}
            />
          </div>
        </article>
      </section>

      <section className="recordMockNext">
        <h2>{t.nextTitle}</h2>
        <div className="recordMockDivider" />

        <ul>
          {t.nextSteps.map((step, index) => (
            <li key={step}>
              <span>{index === 3 ? "✓" : index === 0 ? "◉" : "🔒"}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
