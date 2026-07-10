"use client";

import { useState } from "react";
import Link from "next/link";
import AppLanguageToggle from "../../components/app/AppLanguageToggle";

const copy = {
  en: {
    eyebrow: "VozEterna App MVP",
    title: "Family Legacy Vault",
    subtitle:
      "Record voice memories, capture video messages, upload family photos, and prepare approved memories for a private family vault.",
    cards: [
      {
        number: "01",
        title: "Consent & Agreements",
        text: "Start here before recording or cloning any voice.",
        href: "/app/consent",
      },
      {
        number: "02",
        title: "Record Voice & Video",
        text: "Use your microphone or camera to capture memories.",
        href: "/app/record",
      },
      {
        number: "03",
        title: "Upload Memories",
        text: "Upload audio, video, and photos for the family vault.",
        href: "/app/upload",
      },
    ],
  },
  es: {
    eyebrow: "MVP de la App VozEterna",
    title: "Bóveda de Legado Familiar",
    subtitle:
      "Graba recuerdos de voz, captura mensajes en video, sube fotos familiares y prepara recuerdos aprobados para una bóveda familiar privada.",
    cards: [
      {
        number: "01",
        title: "Consentimiento y Acuerdos",
        text: "Empieza aquí antes de grabar o clonar cualquier voz.",
        href: "/app/consent",
      },
      {
        number: "02",
        title: "Grabar Voz y Video",
        text: "Usa tu micrófono o cámara para capturar recuerdos.",
        href: "/app/record",
      },
      {
        number: "03",
        title: "Subir Recuerdos",
        text: "Sube audio, video y fotos para la bóveda familiar.",
        href: "/app/upload",
      },
    ],
  },
};

export default function VozEternaAppPage() {
  const [language, setLanguage] = useState("en");
  const t = copy[language];

  return (
    <main className="appShell">
      <div className="appTopBar">
        <Link href="/" className="textLink">
          {language === "en" ? "Back to website" : "Volver al sitio"}
        </Link>

        <AppLanguageToggle language={language} setLanguage={setLanguage} />
      </div>

      <section className="appHero">
        <p className="appEyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </section>

      <section className="appGrid">
        {t.cards.map((card) => (
          <Link href={card.href} className="appCard" key={card.number}>
            <span>{card.number}</span>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}