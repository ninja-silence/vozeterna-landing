"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Private Invite",
    title: "Join family network",
    subtitle: "This invite gives access only to the private family network selected by the owner.",
    checking: "Checking invite...",
    success: "You joined the family network.",
    error: "This invite could not be accepted.",
    signIn: "Please sign in before accepting this invite.",
    goFeed: "Go to feed",
    goAccount: "Go to account",
    privacy: "Invite-only access. This does not make the vault public.",
  },
  es: {
    label: "Invitación privada",
    title: "Unirse a red familiar",
    subtitle: "Esta invitación da acceso solo a la red familiar privada seleccionada por el dueño.",
    checking: "Revisando invitación...",
    success: "Te uniste a la red familiar.",
    error: "No se pudo aceptar esta invitación.",
    signIn: "Inicia sesión antes de aceptar esta invitación.",
    goFeed: "Ir al feed",
    goAccount: "Ir a cuenta",
    privacy: "Acceso solo por invitación. Esto no hace pública la bóveda.",
  },
};

export default function MobileInvitePage({ params }) {
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());

    function handleLanguageChange(event) {
      if (event.detail === "en" || event.detail === "es") {
        setLanguage(event.detail);
      }
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("vozeterna-language-change", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    acceptInvite();
  }, []);

  async function acceptInvite() {
    setStatus("checking");
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("signin");
      setMessage(t.signIn);
      return;
    }

    const token = params?.token;

    if (!token) {
      setStatus("error");
      setMessage(t.error);
      return;
    }

    const { error } = await supabase.rpc("accept_sharable_link", {
      invite_token: token,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message || t.error);
      return;
    }

    setStatus("success");
    setMessage(t.success);
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="mobileInviteAcceptCard">
        <div className={status === "success" ? "mobileInviteIcon success" : "mobileInviteIcon"}>
          {status === "success" ? <CheckCircle2 size={34} /> : <UsersRound size={34} />}
        </div>

        <h2>
          {status === "checking"
            ? t.checking
            : status === "success"
              ? t.success
              : message}
        </h2>

        <div className="mobileConsentNotice">
          <ShieldCheck size={20} />
          <p>{t.privacy}</p>
        </div>

        {status === "success" && (
          <Link href="/mobile/feed" className="mobileRecorderPrimary">
            {t.goFeed}
          </Link>
        )}

        {status === "signin" && (
          <Link href="/mobile/account" className="mobileRecorderPrimary">
            {t.goAccount}
          </Link>
        )}

        {status === "error" && (
          <Link href="/mobile" className="mobileRecorderSecondary">
            VozEterna
          </Link>
        )}
      </section>
    </section>
  );
}