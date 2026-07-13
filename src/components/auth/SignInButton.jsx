"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function SignInButton({
  label = "Sign In",
  language = "en",
  redirectTo = "/mobile",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const copy = {
    en: {
      signIn: label || "Sign In",
      title: "Sign in to VozEterna",
      subtitle:
        "Enter your email and we’ll send a secure passwordless login link to your inbox.",
      placeholder: "name@example.com",
      cancel: "Cancel",
      send: "Send Magic Link",
      sending: "Sending...",
      sent: "Magic link sent. Check your inbox.",
      failed: "Something went wrong. Please try again.",
      missing: "Please enter your email.",
    },
    es: {
      signIn: label || "Iniciar sesión",
      title: "Inicia sesión en VozEterna",
      subtitle:
        "Ingresa tu correo y te enviaremos un enlace seguro para iniciar sesión sin contraseña.",
      placeholder: "nombre@ejemplo.com",
      cancel: "Cancelar",
      send: "Enviar enlace",
      sending: "Enviando...",
      sent: "Enlace enviado. Revisa tu correo.",
      failed: "Algo salió mal. Inténtalo de nuevo.",
      missing: "Ingresa tu correo.",
    },
  };

  const t = copy[language] || copy.en;

  async function handleMagicLinkSubmit(event) {
    event.preventDefault();
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage(t.missing);
      return;
    }

    setLoading(true);

    try {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://vozeterna-landing.vercel.app";

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${origin}${redirectTo}`,
        },
      });

      if (error) {
        setMessage(error.message || t.failed);
        return;
      }

      setMessage(t.sent);
    } catch {
      setMessage(t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="vozSignInButton">
        {t.signIn}
      </button>

      {isOpen && (
        <div className="vozAuthOverlay">
          <div className="vozAuthModal">
            <button
              type="button"
              className="vozAuthClose"
              onClick={() => setIsOpen(false)}
              aria-label="Close sign in"
            >
              <X size={18} />
            </button>

            <p className="mobileCapsLabel">VozEterna</p>
            <h3>{t.title}</h3>
            <p>{t.subtitle}</p>

            <form onSubmit={handleMagicLinkSubmit} className="vozAuthForm">
              <input
                type="email"
                required
                placeholder={t.placeholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <div className="vozAuthActions">
                <button type="button" onClick={() => setIsOpen(false)}>
                  {t.cancel}
                </button>

                <button type="submit" disabled={loading}>
                  {loading ? t.sending : t.send}
                </button>
              </div>
            </form>

            {message && <p className="vozAuthMessage">{message}</p>}
          </div>
        </div>
      )}
    </>
  );
}