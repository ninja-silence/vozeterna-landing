"use client";

import { useState } from "react";
import Link from "next/link";
import AppLanguageToggle from "../../../components/app/AppLanguageToggle";

const copy = {
  en: {
    step: "Step 1",
    title: "Consent & Disclosure",
    subtitle:
      "Before recording, uploading, or creating a cloned voice, the person must clearly consent.",
    formTitle: "Voice Recording and AI Voice Consent",
    paragraphs: [
      "I understand that VozEterna may allow me to record or upload my voice for preservation, transcription, family legacy purposes, and optional AI voice-related features.",
      "I confirm that I am the person being recorded, or that I have the legal right and permission to submit this voice recording. I understand that AI voice cloning can create synthetic audio that sounds similar to the recorded person.",
      "I understand that any AI voice feature must be used only for lawful, respectful, family legacy purposes and may not be used to impersonate, deceive, defraud, harass, or mislead anyone.",
      "I understand that VozEterna is in Founder Beta and that features, storage, privacy controls, AI tools, and service availability may change.",
    ],
    fullName: "Full legal name",
    placeholder: "Type your full legal name",
    checkbox:
      "I consent to voice recording and optional AI voice processing for VozEterna legacy purposes.",
    save: "Save Consent",
    alert: "Please type your full legal name and accept the consent agreement.",
    saved: "Consent saved on this device. You can now continue to recording.",
    continue: "Continue to recorder",
    back: "Back to app",
  },
  es: {
    step: "Paso 1",
    title: "Consentimiento y Divulgación",
    subtitle:
      "Antes de grabar, subir archivos o crear una voz clonada, la persona debe dar su consentimiento claramente.",
    formTitle: "Consentimiento para Grabación de Voz e IA",
    paragraphs: [
      "Entiendo que VozEterna puede permitirme grabar o subir mi voz para preservación, transcripción, legado familiar y funciones opcionales relacionadas con voz por IA.",
      "Confirmo que soy la persona que está siendo grabada, o que tengo el derecho legal y permiso para enviar esta grabación de voz. Entiendo que la clonación de voz por IA puede crear audio sintético que suena similar a la persona grabada.",
      "Entiendo que cualquier función de voz por IA debe usarse únicamente para fines legales, respetuosos y de legado familiar, y no debe usarse para suplantar, engañar, defraudar, acosar o confundir a nadie.",
      "Entiendo que VozEterna está en Programa Fundador y que las funciones, almacenamiento, controles de privacidad, herramientas de IA y disponibilidad del servicio pueden cambiar.",
    ],
    fullName: "Nombre legal completo",
    placeholder: "Escribe tu nombre legal completo",
    checkbox:
      "Doy mi consentimiento para grabación de voz y procesamiento opcional de voz por IA para fines de legado en VozEterna.",
    save: "Guardar Consentimiento",
    alert: "Por favor escribe tu nombre legal completo y acepta el consentimiento.",
    saved: "Consentimiento guardado en este dispositivo. Ahora puedes continuar a grabar.",
    continue: "Continuar a grabadora",
    back: "Volver a la app",
  },
};

export default function ConsentPage() {
  const [language, setLanguage] = useState("en");
  const [fullName, setFullName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [saved, setSaved] = useState(false);
  const t = copy[language];

  function handleSubmit(e) {
    e.preventDefault();

    if (!fullName.trim() || !accepted) {
      alert(t.alert);
      return;
    }

    const consentRecord = {
      fullName,
      accepted,
      acceptedAt: new Date().toISOString(),
      agreementVersion: "Founder Beta Consent v1",
      language,
    };

    localStorage.setItem("vozeterna_voice_consent", JSON.stringify(consentRecord));
    setSaved(true);
  }

  return (
    <main className="appShell">
      <div className="appTopBar">
        <Link href="/app" className="textLink">
          {t.back}
        </Link>

        <AppLanguageToggle language={language} setLanguage={setLanguage} />
      </div>

      <section className="appHero compact">
        <p className="appEyebrow">{t.step}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </section>

      <form className="consentBox" onSubmit={handleSubmit}>
        <h2>{t.formTitle}</h2>

        {t.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        <label className="fieldLabel" htmlFor="fullName">
          {t.fullName}
        </label>

        <input
          id="fullName"
          className="appInput"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t.placeholder}
        />

        <label className="checkRow">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>{t.checkbox}</span>
        </label>

        <button className="appButton" type="submit">
          {t.save}
        </button>

        {saved && (
          <div className="successBox">
            {t.saved}
            <br />
            <Link href="/app/record">{t.continue}</Link>
          </div>
        )}
      </form>
    </main>
  );
}