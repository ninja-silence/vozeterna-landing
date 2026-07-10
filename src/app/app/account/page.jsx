"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useAppLanguage } from "../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Account & Identity",
    title: "Protect Your Legacy Vault",
    subtitle:
      "Your legal name helps protect consent records, signatures, recordings, and future AI voice permissions.",
    signInTitle: "Please sign in",
    signInText: "You need to sign in before setting up your account.",
    signIn: "Sign in",
    back: "Back to dashboard",
    label: "Legal full name",
    placeholder: "Example: Felipe Frias",
    save: "Save legal name",
    saving: "Saving...",
    success: "Legal name saved.",
    required: "Please enter your legal full name.",
    current: "Current account email",
    consent: "Continue to consent",
    trustEyebrow: "Why this matters",
    trustTitle: "Consent starts with identity",
    trustText:
      "VozEterna uses your legal name to connect signed agreements, consent records, and future voice permissions to the correct account owner.",
    points: [
      "Used on consent records.",
      "Connected to your captured signature.",
      "Helps protect future AI voice features.",
      "Keeps family memories tied to the correct account.",
    ],
    consentStatus: "Consent status",
    signed: "Signed",
    notSigned: "Not signed yet",
    latestConsent: "Latest consent",
    agreementVersion: "Agreement version",
    noConsentText:
      "Complete consent before recording voice or video memories.",
  },
  es: {
    eyebrow: "Cuenta e identidad",
    title: "Protege tu bóveda de legado",
    subtitle:
      "Tu nombre legal ayuda a proteger consentimientos, firmas, grabaciones y futuros permisos de voz con IA.",
    signInTitle: "Por favor inicia sesión",
    signInText: "Necesitas iniciar sesión antes de configurar tu cuenta.",
    signIn: "Iniciar sesión",
    back: "Volver al inicio",
    label: "Nombre legal completo",
    placeholder: "Ejemplo: Felipe Frias",
    save: "Guardar nombre legal",
    saving: "Guardando...",
    success: "Nombre legal guardado.",
    required: "Por favor ingresa tu nombre legal completo.",
    current: "Correo actual de la cuenta",
    consent: "Continuar al consentimiento",
    trustEyebrow: "Por qué importa",
    trustTitle: "El consentimiento comienza con identidad",
    trustText:
      "VozEterna usa tu nombre legal para conectar acuerdos firmados, consentimientos y futuros permisos de voz con el dueño correcto de la cuenta.",
    points: [
      "Se usa en los consentimientos.",
      "Se conecta con tu firma capturada.",
      "Ayuda a proteger futuras funciones de voz con IA.",
      "Mantiene los recuerdos familiares ligados a la cuenta correcta.",
    ],
    consentStatus: "Estado del consentimiento",
    signed: "Firmado",
    notSigned: "Aún no firmado",
    latestConsent: "Consentimiento más reciente",
    agreementVersion: "Versión del acuerdo",
    noConsentText:
      "Completa el consentimiento antes de grabar recuerdos de voz o video.",
  },
};

export default function AccountPage() {
  const language = useAppLanguage();
  const t = copy[language];

  const [user, setUser] = useState(null);
  const [legalName, setLegalName] = useState("");
  const [latestConsent, setLatestConsent] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const [{ data: profileData }, { data: consentData }] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("legal_full_name")
          .eq("id", currentUser.id)
          .maybeSingle(),

        supabase
          .from("consent_records")
          .select("full_name, agreement_version, accepted_at, signature_data_url")
          .eq("user_id", currentUser.id)
          .eq("accepted", true)
          .order("accepted_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileData?.legal_full_name) {
        setLegalName(profileData.legal_full_name);
      }

      if (consentData) {
        setLatestConsent(consentData);
      }

      setLoading(false);
    }

    loadAccount();
  }, []);

  function formatDate(value) {
    if (!value) return "";

    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");

    if (!legalName.trim()) {
      setMessage(t.required);
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id,
      legal_full_name: legalName.trim(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

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
            <Link href="/app" className="appButton secondary">
              {t.back}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell accountTrustShell">
      <section className="accountTrustHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <aside className="accountStatusCard">
          <p className="appEyebrow">{t.consentStatus}</p>

          <div className={latestConsent ? "consentStatusPill signed" : "consentStatusPill"}>
            {latestConsent ? t.signed : t.notSigned}
          </div>

          {latestConsent ? (
            <div className="accountConsentMeta">
              <p>
                <strong>{t.latestConsent}:</strong> {formatDate(latestConsent.accepted_at)}
              </p>
              <p>
                <strong>{t.agreementVersion}:</strong> {latestConsent.agreement_version}
              </p>
            </div>
          ) : (
            <p>{t.noConsentText}</p>
          )}

          <Link href="/app/consent" className="appButton secondary">
            {t.consent}
          </Link>
        </aside>
      </section>

      <section className="accountTrustGrid">
        <form className="accountIdentityCard" onSubmit={handleSave}>
          {message && <div className="successBox">{message}</div>}

          <div className="identityEmailBox">
            <p className="appEyebrow">{t.current}</p>
            <strong>{user.email}</strong>
          </div>

          <label className="fieldLabel" htmlFor="legalName">
            {t.label}
          </label>

          <input
            id="legalName"
            className="appInput"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder={t.placeholder}
          />

          <div className="buttonRow">
            <button type="submit" className="appButton" disabled={saving}>
              {saving ? t.saving : t.save}
            </button>

            <Link href="/app/consent" className="appButton secondary">
              {t.consent}
            </Link>

            <Link href="/app" className="appButton ghost">
              {t.back}
            </Link>
          </div>
        </form>

        <aside className="identityTrustCard">
          <span>VE</span>
          <p className="appEyebrow">{t.trustEyebrow}</p>
          <h2>{t.trustTitle}</h2>
          <p>{t.trustText}</p>

          <div className="identityTrustPoints">
            {t.points.map((point) => (
              <div className="identityTrustPoint" key={point}>
                <span>✓</span>
                <p>{point}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}