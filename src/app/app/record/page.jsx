"use client";

import { useState } from "react";
import Link from "next/link";
import AudioRecorder from "../../../components/app/AudioRecorder";
import CameraRecorder from "../../../components/app/CameraRecorder";
import AppLanguageToggle from "../../../components/app/AppLanguageToggle";

const copy = {
  en: {
    step: "Step 2",
    title: "Record Memories",
    subtitle: "Capture voice, audio, and video memories. Consent must be completed before recording.",
    review: "Review consent agreement",
    back: "Back to app",
  },
  es: {
    step: "Paso 2",
    title: "Grabar Recuerdos",
    subtitle: "Captura recuerdos de voz, audio y video. El consentimiento debe completarse antes de grabar.",
    review: "Revisar consentimiento",
    back: "Volver a la app",
  },
};

export default function RecordPage() {
  const [language, setLanguage] = useState("en");
  const t = copy[language];

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

        <Link href="/app/consent" className="textLink">
          {t.review}
        </Link>
      </section>

      <section className="recorderGrid">
        <AudioRecorder language={language} />
        <CameraRecorder language={language} />
      </section>
    </main>
  );
}