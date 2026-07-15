"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import AuthModal from "../../../../components/auth/AuthModal";
import { supabase } from "../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Account Invite",
    title: "Join VozEterna",
    subtitle: "Create your private beta account or sign in to continue.",
    loading: "Loading invite...",
    invalid: "This account invite is no longer valid.",
    signIn: "Create your account or sign in to accept this VozEterna invitation.",
    accepted: "Invite accepted.",
    accepting: "Accepting invite...",
    continue: "Continue to VozEterna",
    home: "VozEterna",
    privacy: "This creates access to VozEterna only. It does not grant access to a private vault.",
  },
  es: {
    label: "Invitación de cuenta",
    title: "Entrar a VozEterna",
    subtitle: "Crea tu cuenta de beta privada o inicia sesión para continuar.",
    loading: "Cargando invitación...",
    invalid: "Esta invitación de cuenta ya no es válida.",
    signIn: "Crea tu cuenta o inicia sesión para aceptar esta invitación a VozEterna.",
    accepted: "Invitación aceptada.",
    accepting: "Aceptando invitación...",
    continue: "Continuar a VozEterna",
    home: "VozEterna",
    privacy: "Esto crea acceso a VozEterna solamente. No da acceso a una bóveda privada.",
  },
};

function isInviteUsable(invite) {
  if (!invite?.id) return false;
  if (invite.status && invite.status !== "active") return false;
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) return false;

  const maxUses = Number(invite.max_uses);
  return !(Number.isFinite(maxUses) && maxUses > 0 && (invite.used_count || 0) >= maxUses);
}

export default function MobileAccountInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token;

  const [language, setLanguage] = useState("en");
  const [invite, setInvite] = useState(null);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());

    function handleLanguageChange(event) {
      if (event.detail === "en" || event.detail === "es") {
        setLanguage(event.detail);
      }
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);
    return () => window.removeEventListener("vozeterna-language-change", handleLanguageChange);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (mounted) setUser(currentUser || null);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInvite() {
      setStatus("loading");
      setMessage("");
      setAuthOpen(false);

      if (!token) {
        setStatus("error");
        setMessage(t.invalid);
        return;
      }

      const { data } = await supabase
        .from("account_invites")
        .select("id, token, status, max_uses, used_count, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (!mounted) return;

      if (!isInviteUsable(data)) {
        setInvite(null);
        setStatus("error");
        setMessage(t.invalid);
        return;
      }

      setInvite(data);
      setStatus("ready");
    }

    loadInvite();

    return () => {
      mounted = false;
    };
  }, [token, language, t.invalid]);

  useEffect(() => {
    if (status !== "ready" || !invite?.id || accepted) return;

    if (!user?.id) {
      setAuthOpen(true);
      return;
    }

    acceptAccountInvite(invite, user);
  }, [status, invite, user, accepted]);

  async function acceptAccountInvite(validInvite, currentUser) {
    setStatus("accepting");
    setMessage("");

    const nextUsedCount = (validInvite.used_count || 0) + 1;
    const maxUses = Number(validInvite.max_uses);
    const nextStatus = Number.isFinite(maxUses) && maxUses === 1 ? "used" : "active";

    const { error } = await supabase
      .from("account_invites")
      .update({
        accepted_by: currentUser.id,
        accepted_at: new Date().toISOString(),
        used_count: nextUsedCount,
        status: nextStatus,
      })
      .eq("id", validInvite.id);

    if (error) {
      setStatus("error");
      setMessage(t.invalid);
      return;
    }

    setAccepted(true);
    setAuthOpen(false);
    setStatus("success");
    setMessage(t.accepted);
    router.push("/mobile");
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
          {status === "success" ? <CheckCircle2 size={34} /> : <UserPlus size={34} />}
        </div>

        <h2>
          {status === "loading"
            ? t.loading
            : status === "accepting"
              ? t.accepting
              : status === "error"
                ? message || t.invalid
                : status === "success"
                  ? t.accepted
                  : t.signIn}
        </h2>

        <div className="mobileConsentNotice">
          <ShieldCheck size={20} />
          <p>{t.privacy}</p>
        </div>

        {status === "success" && (
          <Link href="/mobile" className="mobileRecorderPrimary">
            {t.continue}
          </Link>
        )}

        {status === "error" && (
          <Link href="/mobile" className="mobileRecorderSecondary">
            {t.home}
          </Link>
        )}
      </section>

      {authOpen && invite && status === "ready" && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          allowSignup={true}
          language={language}
          helperText={t.signIn}
          redirectTo={`/mobile/account-invite/${token}`}
        />
      )}
    </section>
  );
}
