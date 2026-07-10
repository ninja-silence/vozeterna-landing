"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SignaturePad from "../../../components/app/SignaturePad";
import { supabase } from "../../../lib/supabaseClient";
import { useAppLanguage } from "../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Voice & AI Consent",
    title: "Consent Before Recording",
    subtitle:
      "Review and sign the consent agreement before recording voice, video, or enabling future AI voice features.",
    signInTitle: "Please sign in",
    signInText: "You need to sign in before completing consent.",
    signIn: "Sign in",
    accountRequiredTitle: "Legal name required",
    accountRequiredText:
      "Please set your legal name before signing consent. This connects the agreement to the correct account owner.",
    accountSetup: "Set legal name",
    legalName: "Legal name on account",
    agreementVersion: "Founder Beta Consent v1",
    summaryEyebrow: "Consent Summary",
    summaryTitle: "What you are agreeing to",
    summaryText:
      "This consent helps VozEterna protect recordings, signatures, family memories, and future AI-related permissions.",
    points: [
      "You understand that voice and video memories are saved to your private vault.",
      "You confirm you have the right or permission to upload or record the selected memories.",
      "You understand future AI voice features require consent and must not be used for deception, fraud, harassment, or impersonation.",
      "You understand private memories are not public unless you choose to share them on a memorial page.",
    ],
    signatureTitle: "Sign consent",
    signatureText:
      "Your signature will be saved with your legal name, agreement version, and timestamp.",
    checkbox:
      "I understand and agree to the VozEterna recording, voice, and AI processing consent terms.",
    submit: "Sign and continue",
    saving: "Saving consent...",
    success: "Consent saved successfully.",
    missingSignature: "Please add your signature before continuing.",
    missingCheckbox: "Please confirm that you understand and agree.",
    back: "Back to account",
    record: "Continue to record",
    trustTitle: "Built for family trust",
    trustText:
      "Consent records help keep legacy memories respectful, private, and connected to the correct account.",
  },
  es: {
    eyebrow: "Consentimiento de voz e IA",
    title: "Consentimiento antes de grabar",
    subtitle:
      "Revisa y firma el consentimiento antes de grabar voz, video o activar futuras funciones de voz con IA.",
    signInTitle: "Por favor inicia sesión",
    signInText: "Necesitas iniciar sesión antes de completar el consentimiento.",
    signIn: "Iniciar sesión",
    accountRequiredTitle: "Nombre legal requerido",
    accountRequiredText:
      "Configura tu nombre legal antes de firmar el consentimiento. Esto conecta el acuerdo con el dueño correcto de la cuenta.",
    accountSetup: "Configurar nombre legal",
    legalName: "Nombre legal en la cuenta",
    agreementVersion: "Founder Beta Consent v1",
    summaryEyebrow: "Resumen del consentimiento",
    summaryTitle: "Lo que estás aceptando",
    summaryText:
      "Este consentimiento ayuda a VozEterna a proteger grabaciones, firmas, recuerdos familiares y futuros permisos relacionados con IA.",
    points: [
      "Entiendes que los recuerdos de voz y video se guardan en tu bóveda privada.",
      "Confirmas que tienes el derecho o permiso para subir o grabar los recuerdos seleccionados.",
      "Entiendes que futuras funciones de voz con IA requieren consentimiento y no deben usarse para engaño, fraude, acoso o suplantación.",
      "Entiendes que los recuerdos privados no son públicos a menos que tú decidas compartirlos en una página memorial.",
    ],
    signatureTitle: "Firmar consentimiento",
    signatureText:
      "Tu firma se guardará con tu nombre legal, versión del acuerdo y fecha/hora.",
    checkbox:
      "Entiendo y acepto los términos de consentimiento de VozEterna para grabación, voz y procesamiento con IA.",
    submit: "Firmar y continuar",
    saving: "Guardando consentimiento...",
    success: "Consentimiento guardado correctamente.",
    missingSignature: "Por favor agrega tu firma antes de continuar.",
    missingCheckbox: "Por favor confirma que entiendes y aceptas.",
    back: "Volver a cuenta",
    record: "Continuar a grabar",
    trustTitle: "Diseñado para confianza familiar",
    trustText:
      "Los registros de consentimiento ayudan a mantener los recuerdos de legado respetuosos, privados y conectados a la cuenta correcta.",
  },
};

export default function ConsentPage() {
  const language = useAppLanguage();
  const t = copy[language];

  const [user, setUser] = useState(null);
  const [legalName, setLegalName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConsentSetup() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("legal_full_name")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileData?.legal_full_name) {
        setLegalName(profileData.legal_full_name);
      }

      setLoading(false);
    }

    loadConsentSetup();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!accepted) {
      setMessage(t.missingCheckbox);
      return;
    }

    if (!signatureDataUrl) {
      setMessage(t.missingSignature);
      return;
    }

    setSaving(true);

    const acceptedAt = new Date().toISOString();

    const { error } = await supabase.from("consent_records").insert({
      user_id: user.id,
      full_name: legalName,
      signer_profile_name: legalName,
      consent_type: "voice_recording_ai_processing",
      agreement_version: t.agreementVersion,
      language,
      accepted: true,
      accepted_at: acceptedAt,
      signature_data_url: signatureDataUrl,
      user_agent: navigator.userAgent,
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    localStorage.setItem(
      "vozeterna_voice_consent",
      JSON.stringify({
        fullName: legalName,
        accepted: true,
        acceptedAt,
        agreementVersion: t.agreementVersion,
        language,
        source: "supabase",
      })
    );

    setMessage(t.success);
    setSaving(false);
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
          </div>
        </section>
      </main>
    );
  }

  if (!legalName) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.accountRequiredTitle}</h1>
          <p>{t.accountRequiredText}</p>

          <div className="buttonRow">
            <Link href="/app/account" className="appButton">
              {t.accountSetup}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell consentTrustShell">
      <section className="consentTrustHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <aside className="consentTrustCard">
          <span>VE</span>
          <h2>{t.trustTitle}</h2>
          <p>{t.trustText}</p>
        </aside>
      </section>

      <section className="consentTrustGrid">
        <aside className="consentSummaryCard">
          <p className="appEyebrow">{t.summaryEyebrow}</p>
          <h2>{t.summaryTitle}</h2>
          <p>{t.summaryText}</p>

          <div className="consentPointList">
            {t.points.map((point) => (
              <div className="consentPoint" key={point}>
                <span>✓</span>
                <p>{point}</p>
              </div>
            ))}
          </div>
        </aside>

        <form className="consentSignatureCard" onSubmit={handleSubmit}>
          {message && <div className="successBox">{message}</div>}

          <div className="consentIdentityBox">
            <div>
              <p className="appEyebrow">{t.legalName}</p>
              <strong>{legalName}</strong>
            </div>

            <div>
              <p className="appEyebrow">
                {language === "es" ? "Versión del acuerdo" : "Agreement version"}
              </p>
              <span>{t.agreementVersion}</span>
            </div>
          </div>

          <div className="signatureIntro">
            <p className="appEyebrow">{t.signatureTitle}</p>
            <h2>{t.signatureTitle}</h2>
            <p>{t.signatureText}</p>
          </div>

          <SignaturePad language={language} onChange={setSignatureDataUrl} />

          <label className="consentCheckRow">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>{t.checkbox}</span>
          </label>

          <div className="buttonRow">
            <button type="submit" className="appButton" disabled={saving}>
              {saving ? t.saving : t.submit}
            </button>

            <Link href="/app/account" className="appButton secondary">
              {t.back}
            </Link>

            {message === t.success && (
              <Link href="/app/record" className="appButton ghost">
                {t.record}
              </Link>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}