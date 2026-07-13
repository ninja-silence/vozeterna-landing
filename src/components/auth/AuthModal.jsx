"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AuthModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  async function handleMagicLinkSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatusMsg("");

    const cleanEmail = email.trim().toLowerCase();

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://vozeterna-landing.vercel.app";

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${origin}/mobile`,
      },
    });

    if (error) {
      setStatusMsg("No se pudo enviar el enlace. Inténtalo de nuevo.");
    } else {
      setStatusMsg("Enlace enviado. Revisa tu correo.");
    }

    setLoading(false);
  }

  return (
    <div className="vozAuthOverlay">
      <div className="vozAuthModal">
        <button type="button" className="vozAuthClose" onClick={onClose}>
          ✕
        </button>

        <p className="mobileCapsLabel">VozEterna</p>
        <h3>Ingresar a VozEterna</h3>
        <p>Ingresa tu correo para recibir un enlace seguro sin contraseña.</p>

        <form onSubmit={handleMagicLinkSubmit} className="vozAuthForm">
          <input
            type="email"
            required
            placeholder="tu-correo@ejemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <div className="vozAuthActions">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </div>
        </form>

        {statusMsg && <p className="vozAuthMessage">{statusMsg}</p>}
      </div>
    </div>
  );
}