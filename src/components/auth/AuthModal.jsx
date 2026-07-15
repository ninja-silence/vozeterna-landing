"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const MAGIC_LINK_COOLDOWN_SECONDS = 60;

const copy = {
  en: {
    title: "Sign in to VozEterna",
    publicHelper: "Sign in if you already have access. New family vaults are currently invitation-only.",
    inviteHelper: "Create your account or sign in to accept this family vault invitation.",
    magicTab: "Magic Link",
    passwordTab: "Password",
    missingEmail: "Please enter your email.",
    passwordShort: "Password should be at least 6 characters.",
    genericPublic: "If you have an account, check your email or try your password.",
    magicSent: "Magic link sent. Check your inbox.",
    cancel: "Cancel",
    sendLink: "Send link",
    sending: "Sending...",
    wait: "Wait",
    cooldown: "Send link available in",
    signingIn: "Signing in...",
    logIn: "Log in",
    working: "Working...",
    createAccount: "Create account",
    accountCreated: "Account created. Check your email if confirmation is required.",
    close: "Close sign in",
    fallbackError: "Something went wrong. Please try again.",
    invalidCredentials: "Invalid login credentials.",
    tooMany: "Too many login links requested. Please wait and try again.",
    emailRegistered: "Email already registered.",
  },
  es: {
    title: "Inicia sesión en VozEterna",
    publicHelper: "Inicia sesión si ya tienes acceso. Las nuevas bóvedas familiares actualmente son por invitación.",
    inviteHelper: "Crea tu cuenta o inicia sesión para aceptar esta invitación a la bóveda familiar.",
    magicTab: "Enlace mágico",
    passwordTab: "Contraseña",
    missingEmail: "Ingresa tu correo.",
    passwordShort: "La contraseña debe tener al menos 6 caracteres.",
    genericPublic: "Si ya tienes una cuenta, revisa tu correo o intenta con tu contraseña.",
    magicSent: "Enlace enviado. Revisa tu correo.",
    cancel: "Cancelar",
    sendLink: "Enviar enlace",
    sending: "Enviando...",
    wait: "Espera",
    cooldown: "Podrás enviar otro enlace en",
    signingIn: "Iniciando sesión...",
    logIn: "Iniciar sesión",
    working: "Procesando...",
    createAccount: "Crear cuenta",
    accountCreated: "Cuenta creada. Revisa tu correo si se requiere confirmación.",
    close: "Cerrar inicio de sesión",
    fallbackError: "Algo salió mal. Inténtalo de nuevo.",
    invalidCredentials: "No pudimos iniciar sesión con esos datos.",
    tooMany: "Se solicitaron demasiados enlaces. Espera e inténtalo de nuevo.",
    emailRegistered: "Ese correo ya está registrado.",
  },
};

function getFriendlyAuthError(error, t) {
  const message = String(error?.message || "").toLowerCase();

  if (message.includes("rate limit") || message.includes("too many")) {
    return t.tooMany;
  }

  if (message.includes("invalid login credentials")) {
    return t.invalidCredentials;
  }

  if (
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("user already")
  ) {
    return t.emailRegistered;
  }

  if (
    message.includes("password") &&
    (message.includes("6") || message.includes("six") || message.includes("short"))
  ) {
    return t.passwordShort;
  }

  return error?.message || t.fallbackError;
}

export default function AuthModal({
  onClose,
  allowSignup = false,
  language = "en",
  helperText,
  redirectTo = "/mobile",
}) {
  const [authMode, setAuthMode] = useState("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const t = copy[language] || copy.en;
  const modalHelper = helperText || (allowSignup ? t.inviteHelper : t.publicHelper);

  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleMagicLinkSubmit(event) {
    event.preventDefault();

    if (cooldown > 0) return;

    setLoading(true);
    setStatusMsg("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setStatusMsg(t.missingEmail);
      setLoading(false);
      return;
    }

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://vozeterna-landing.vercel.app";

    const otpOptions = {
      emailRedirectTo: `${origin}${redirectTo}`,
    };

    if (!allowSignup) {
      otpOptions.shouldCreateUser = false;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: otpOptions,
    });

    if (error && allowSignup) {
      setStatusMsg(getFriendlyAuthError(error, t));
    } else {
      setCooldown(MAGIC_LINK_COOLDOWN_SECONDS);
      setStatusMsg(allowSignup ? t.magicSent : t.genericPublic);
    }

    setLoading(false);
  }

  async function handlePasswordLogin() {
    setLoading(true);
    setStatusMsg("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setStatusMsg(t.missingEmail);
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setStatusMsg(t.passwordShort);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setStatusMsg(allowSignup ? getFriendlyAuthError(error, t) : t.genericPublic);
    } else {
      setLoading(false);
      onClose?.();
      return;
    }

    setLoading(false);
  }

  async function handlePasswordSignup() {
    setLoading(true);
    setStatusMsg("");

    const cleanEmail = email.trim().toLowerCase();

    if (!allowSignup) {
      setStatusMsg(t.genericPublic);
      setLoading(false);
      return;
    }

    if (!cleanEmail) {
      setStatusMsg(t.missingEmail);
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setStatusMsg(t.passwordShort);
      setLoading(false);
      return;
    }

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://vozeterna-landing.vercel.app";

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${origin}${redirectTo}`,
      },
    });

    if (error) {
      setStatusMsg(getFriendlyAuthError(error, t));
    } else if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setStatusMsg(t.emailRegistered);
    } else {
      setStatusMsg(t.accountCreated);
    }

    setLoading(false);
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();
    handlePasswordLogin();
  }

  const magicLinkDisabled = loading || cooldown > 0;

  return (
    <div className="vozAuthOverlay">
      <div className="vozAuthModal">
        <button type="button" className="vozAuthClose" onClick={onClose} aria-label={t.close}>
          x
        </button>

        <p className="mobileCapsLabel">VozEterna</p>
        <h3>{t.title}</h3>
        <p>{modalHelper}</p>

        <div className="vozAuthTabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={authMode === "magic"}
            className={authMode === "magic" ? "active" : ""}
            onClick={() => {
              setAuthMode("magic");
              setStatusMsg("");
            }}
          >
            {t.magicTab}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={authMode === "password"}
            className={authMode === "password" ? "active" : ""}
            onClick={() => {
              setAuthMode("password");
              setStatusMsg("");
            }}
          >
            {t.passwordTab}
          </button>
        </div>

        <form
          onSubmit={authMode === "magic" ? handleMagicLinkSubmit : handlePasswordSubmit}
          className="vozAuthForm"
        >
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {authMode === "password" && (
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}

          {authMode === "magic" && cooldown > 0 && (
            <p className="vozAuthCooldown">{t.cooldown} {cooldown}s.</p>
          )}

          <div className="vozAuthActions">
            <button type="button" onClick={onClose}>
              {t.cancel}
            </button>

            <button type="submit" disabled={authMode === "magic" ? magicLinkDisabled : loading}>
              {authMode === "magic"
                ? loading
                  ? t.sending
                  : cooldown > 0
                    ? `${t.wait} ${cooldown}s`
                    : t.sendLink
                : loading
                  ? t.signingIn
                  : t.logIn}
            </button>
          </div>

          {authMode === "password" && allowSignup && (
            <button
              type="button"
              className="vozAuthCreateButton"
              onClick={handlePasswordSignup}
              disabled={loading}
            >
              {loading ? t.working : t.createAccount}
            </button>
          )}
        </form>

        {statusMsg && <p className="vozAuthMessage">{statusMsg}</p>}
      </div>
    </div>
  );
}
