"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileSignature, RotateCcw, ShieldCheck } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Consent",
    title: "Consent & Agreements",
    subtitle:
      "Review and confirm authorization for voice memories, family vault participation, and private legacy features.",
    current: "Current consent records",
    loading: "Loading consent records...",
    empty: "No consent records yet.",
    sign: "Sign and confirm consent",
    signing: "Saving consent...",
    signed: "Consent saved.",
    protected: "Private by default. Consent helps keep your family memories authorized and secure.",
    signature: "Electronic signature",
    clear: "Clear signature",
    signIn: "Please sign in before saving consent.",
    missingSignature: "Please sign your name before saving.",
  },
  es: {
    label: "Consentimiento",
    title: "Consentimiento y acuerdos",
    subtitle:
      "Revisa y confirma la autorización para recuerdos de voz, participación familiar y funciones privadas de legado.",
    current: "Registros actuales",
    loading: "Cargando registros...",
    empty: "Todavía no hay registros de consentimiento.",
    sign: "Firmar y confirmar consentimiento",
    signing: "Guardando consentimiento...",
    signed: "Consentimiento guardado.",
    protected: "Privado por defecto. El consentimiento ayuda a mantener tus recuerdos autorizados y seguros.",
    signature: "Firma electrónica",
    clear: "Borrar firma",
    signIn: "Inicia sesión antes de guardar consentimiento.",
    missingSignature: "Firma tu nombre antes de guardar.",
  },
};

export default function MobileConsentPage() {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const signedRef = useRef(false);

  const [language, setLanguage] = useState("en");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());
    setupCanvas();

    function handleResize() {
      setupCanvas();
    }

    function handleLanguageChange(event) {
      if (event.detail === "en" || event.detail === "es") {
        setLanguage(event.detail);
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("vozeterna-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("vozeterna-language-change", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    loadConsent();
  }, []);

  function setupCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#fff3df";
  }

  function getPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches?.[0];

    return {
      x: (touch ? touch.clientX : event.clientX) - rect.left,
      y: (touch ? touch.clientY : event.clientY) - rect.top,
    };
  }

  function startDrawing(event) {
    event.preventDefault();
    drawingRef.current = true;
    signedRef.current = true;

    const point = getPoint(event);
    const ctx = canvasRef.current.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  function draw(event) {
    if (!drawingRef.current) return;

    event.preventDefault();

    const point = getPoint(event);
    const ctx = canvasRef.current.getContext("2d");

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function stopDrawing() {
    drawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signedRef.current = false;
    setMessage("");
    setupCanvas();
  }

  async function loadConsent() {
    setLoading(true);

    const { data } = await supabase
      .from("consent_records")
      .select("id, full_name, consent_type, agreement_version, language, accepted_at")
      .order("accepted_at", { ascending: false })
      .limit(10);

    setRecords(data || []);
    setLoading(false);
  }

  async function signConsent() {
    setSaving(true);
    setMessage("");

    if (!signedRef.current) {
      setSaving(false);
      setMessage(t.missingSignature);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setMessage(t.signIn);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, legal_name")
      .eq("id", user.id)
      .maybeSingle();

    const fullName =
      profile?.legal_name ||
      profile?.display_name ||
      user.email ||
      "Mobile user";

    const signatureDataUrl = canvasRef.current.toDataURL("image/png");

    const { error } = await supabase.from("consent_records").insert({
      user_id: user.id,
      full_name: fullName,
      consent_type: "mobile_family_vault_participation",
      agreement_version: "Mobile Consent v1",
      language,
      accepted: true,
      accepted_at: new Date().toISOString(),
      signer_profile_name: fullName,
      signature_data_url: signatureDataUrl,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(t.signed);
    clearSignature();
    loadConsent();
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="mobileConsentNotice">
        <ShieldCheck size={22} />
        <p>{t.protected}</p>
      </section>

      <section className="mobileFormCard">
        <p className="mobileCapsLabel">{t.signature}</p>

        <canvas
          ref={canvasRef}
          className="mobileSignatureCanvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        <button type="button" className="mobileRecorderSecondary" onClick={clearSignature}>
          <RotateCcw size={17} />
          {t.clear}
        </button>

        <button type="button" onClick={signConsent} disabled={saving}>
          <FileSignature size={17} />
          {saving ? t.signing : t.sign}
        </button>

        {message && (
          <p className={message === t.signed ? "mobileSuccessMessage" : "mobileFormMessage"}>
            {message === t.signed && <CheckCircle2 size={16} />}
            <span>{message}</span>
          </p>
        )}
      </section>

      <section className="mobileFormCard">
        <p className="mobileCapsLabel">{t.current}</p>

        {loading ? (
          <p className="mobileFormHelper">{t.loading}</p>
        ) : records.length === 0 ? (
          <p className="mobileFormHelper">{t.empty}</p>
        ) : (
          <div className="mobileConsentList">
            {records.map((record) => (
              <article key={record.id}>
                <CheckCircle2 size={18} />
                <div>
                  <strong>{record.full_name || t.signed}</strong>
                  <span>{record.agreement_version}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}