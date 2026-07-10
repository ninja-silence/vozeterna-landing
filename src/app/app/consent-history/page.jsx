"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useAppLanguage } from "../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Consent History",
    title: "Signed Consent Records",
    subtitle:
      "Review signed consent records connected to your VozEterna account, including legal name, agreement version, timestamp, and captured signature.",
    signInTitle: "Please sign in",
    signInText: "You need to sign in before viewing consent records.",
    signIn: "Sign in",
    back: "Back to dashboard",
    signNew: "Sign new consent",
    account: "Account",
    emptyTitle: "No consent records yet",
    emptyText: "Complete the consent agreement before recording voice or video memories.",
    completeConsent: "Complete consent",
    latest: "Latest",
    record: "Consent Record",
    type: "Type",
    version: "Version",
    language: "Language",
    signed: "Signed",
    noSignature: "No signature saved",
    trustTitle: "Consent protects the vault",
    trustText:
      "These records help connect signed agreements, legal names, signatures, and future voice permissions to the correct account.",
    consentTypes: {
      voice_recording_ai_processing: "Voice Recording & AI Processing Consent",
    },
  },
  es: {
    eyebrow: "Historial de consentimiento",
    title: "Registros de consentimiento firmados",
    subtitle:
      "Revisa consentimientos firmados conectados a tu cuenta de VozEterna, incluyendo nombre legal, versión del acuerdo, fecha/hora y firma capturada.",
    signInTitle: "Por favor inicia sesión",
    signInText: "Necesitas iniciar sesión antes de ver los registros de consentimiento.",
    signIn: "Iniciar sesión",
    back: "Volver al inicio",
    signNew: "Firmar nuevo consentimiento",
    account: "Cuenta",
    emptyTitle: "Todavía no hay consentimientos",
    emptyText: "Completa el consentimiento antes de grabar recuerdos de voz o video.",
    completeConsent: "Completar consentimiento",
    latest: "Más reciente",
    record: "Registro de consentimiento",
    type: "Tipo",
    version: "Versión",
    language: "Idioma",
    signed: "Firmado",
    noSignature: "No hay firma guardada",
    trustTitle: "El consentimiento protege la bóveda",
    trustText:
      "Estos registros ayudan a conectar acuerdos firmados, nombres legales, firmas y futuros permisos de voz con la cuenta correcta.",
    consentTypes: {
      voice_recording_ai_processing: "Consentimiento de grabación de voz y procesamiento con IA",
    },
  },
};

export default function ConsentHistoryPage() {
  const language = useAppLanguage();
  const t = copy[language];

  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadConsentHistory() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("consent_records")
        .select("*")
        .order("accepted_at", { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        setRecords(data || []);
      }

      setLoading(false);
    }

    loadConsentHistory();
  }, []);

  function formatDate(value) {
    if (!value) return language === "es" ? "Fecha desconocida" : "Unknown date";

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function formatConsentType(type) {
    return t.consentTypes[type] || type || t.record;
  }

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{language === "es" ? "Cargando..." : "Loading..."}</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.signInTitle}</h1>
          <p>{t.signInText}</p>

          <div className="buttonRow">
            <Link href="/app/login" className="appButton">
              {t.signIn}
            </Link>

            <Link href="/app" className="appButton secondary">
              {t.back}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell consentHistoryShell">
      <section className="consentHistoryHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>

          <div className="buttonRow">
            <Link href="/app/consent" className="appButton">
              {t.signNew}
            </Link>

            <Link href="/app/account" className="appButton secondary">
              {t.account}
            </Link>
          </div>
        </div>

        <aside className="consentHistoryTrustCard">
          <span>VE</span>
          <h2>{t.trustTitle}</h2>
          <p>{t.trustText}</p>
        </aside>
      </section>

      {message && <div className="successBox consentHistoryMessage">{message}</div>}

      {records.length === 0 ? (
        <section className="emptyState">
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>

          <Link href="/app/consent" className="appButton">
            {t.completeConsent}
          </Link>
        </section>
      ) : (
        <section className="consentArchiveGrid">
          {records.map((record, index) => (
            <article className="consentArchiveCard" key={record.id}>
              <div className="consentArchiveInfo">
                <div className="consentArchiveHeader">
                  <p className="appEyebrow">
                    {t.record} {index === 0 ? `• ${t.latest}` : ""}
                  </p>

                  {index === 0 && <span>{t.latest}</span>}
                </div>

                <h2>{record.full_name}</h2>

                <div className="consentArchiveMeta">
                  <p>
                    <strong>{t.type}:</strong> {formatConsentType(record.consent_type)}
                  </p>
                  <p>
                    <strong>{t.version}:</strong> {record.agreement_version}
                  </p>
                  <p>
                    <strong>{t.language}:</strong> {record.language?.toUpperCase()}
                  </p>
                  <p>
                    <strong>{t.signed}:</strong> {formatDate(record.accepted_at)}
                  </p>
                </div>
              </div>

              <div className="consentArchiveSignature">
                {record.signature_data_url ? (
                  <img src={record.signature_data_url} alt="Signature" />
                ) : (
                  <span>{t.noSignature}</span>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}