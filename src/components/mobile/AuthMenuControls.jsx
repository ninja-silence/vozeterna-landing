"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import AuthModal from "../auth/AuthModal";

const copy = {
  en: {
    signIn: "Log in / Create account",
    logout: "Log out",
    account: "Account",
    signedInAs: "Signed in as",
    kyc: "KYC / Premium",
  },
  es: {
    signIn: "Iniciar sesión / Crear cuenta",
    logout: "Cerrar sesión",
    account: "Cuenta",
    signedInAs: "Sesión iniciada como",
    kyc: "KYC / Premium",
  },
};

export default function AuthMenuControls({ language = "en", onNavigate }) {
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const t = copy[language] || copy.en;

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(data?.session || null);
      setLoading(false);
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleLogout(event) {
    event.preventDefault();
    event.stopPropagation();

    await supabase.auth.signOut();
    setSession(null);

    if (typeof onNavigate === "function") {
      onNavigate();
    }

    window.location.href = "/mobile";
  }

  function openAuthModal(event) {
    event.preventDefault();
    event.stopPropagation();
    setAuthOpen(true);
  }

  function goTo(event, path) {
    event.preventDefault();
    event.stopPropagation();

    if (typeof onNavigate === "function") {
      onNavigate();
    }

    window.location.href = path;
  }

  if (loading) return null;

  const email = session?.user?.email || "";

  return (
    <div className="mobileMenuAuthControls">
      {!session ? (
        <button type="button" className="mobileMenuAuthPrimary" onClick={openAuthModal}>
          <LogIn size={17} />
          {t.signIn}
        </button>
      ) : (
        <>
          <div className="mobileMenuSignedInCard">
            <UserRound size={18} />
            <div>
              <span>{t.signedInAs}</span>
              <strong>{email}</strong>
            </div>
          </div>

          <button
            type="button"
            className="mobileMenuAuthSecondary"
            onClick={(event) => goTo(event, "/mobile/account")}
          >
            <UserRound size={17} />
            {t.account}
          </button>

          <button
            type="button"
            className="mobileMenuAuthSecondary"
            onClick={(event) => goTo(event, "/mobile/kyc")}
          >
            <ShieldCheck size={17} />
            {t.kyc}
          </button>

          <button type="button" className="mobileMenuLogoutButton" onClick={handleLogout}>
            <LogOut size={17} />
            {t.logout}
          </button>
        </>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}