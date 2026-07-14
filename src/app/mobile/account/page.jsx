"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Crown, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import AuthModal from "../../../components/auth/AuthModal";
import { supabase } from "../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Account",
    title: "Account",
    signedOut: "Sign in to manage your private account settings.",
    signIn: "Log in / Create account",
    email: "Email",
    displayName: "Display name / username",
    phone: "Phone",
    address: "Address",
    avatar: "Profile picture",
    avatarText: "Avatar upload is not enabled here yet.",
    save: "Save changes",
    saving: "Saving...",
    saved: "Account saved.",
    partial:
      "Saved the fields supported by your current profiles table. Some fields may need SQL columns.",
    noEditable:
      "Your profiles table does not expose editable account fields yet. SQL may be needed.",
    loadError: "Could not load account profile.",
    saveError: "Could not save account changes. Some profile columns may be missing.",
    verification: "Verification status",
    kyc: "KYC status",
    premium: "Premium tier",
    unverified: "Unverified",
    notStarted: "Not started",
    free: "Free",
    connectedPeople: "Connected people",
    connectedPeopleText: "View family and friends connected through invites.",
    consent: "Consent",
    consentText: "Review consent and authorization records.",
  },
  es: {
    label: "Cuenta",
    title: "Cuenta",
    signedOut: "Inicia sesion para administrar tu cuenta privada.",
    signIn: "Iniciar sesion / Crear cuenta",
    email: "Email",
    displayName: "Nombre visible / usuario",
    phone: "Telefono",
    address: "Direccion",
    avatar: "Foto de perfil",
    avatarText: "La carga de avatar aun no esta activa aqui.",
    save: "Guardar cambios",
    saving: "Guardando...",
    saved: "Cuenta guardada.",
    partial:
      "Se guardaron los campos disponibles en tu tabla profiles. Algunos campos pueden necesitar SQL.",
    noEditable:
      "Tu tabla profiles aun no expone campos editables de cuenta. Puede necesitar SQL.",
    loadError: "No se pudo cargar el perfil de cuenta.",
    saveError: "No se pudieron guardar los cambios. Puede faltar alguna columna.",
    verification: "Estado de verificacion",
    kyc: "Estado KYC",
    premium: "Nivel premium",
    unverified: "No verificado",
    notStarted: "No iniciado",
    free: "Free",
    connectedPeople: "Personas conectadas",
    connectedPeopleText: "Ver familia y amigos conectados por invitaciones.",
    consent: "Consentimiento",
    consentText: "Revisar consentimientos y autorizaciones.",
  },
};

const NAME_FIELDS = ["display_name", "username", "full_name"];
const EDITABLE_FIELDS = [...NAME_FIELDS, "phone", "address"];

function formatStatus(value, fallback) {
  const clean = String(value || "").trim();
  if (!clean) return fallback;
  return clean
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPremiumValue(profile = {}) {
  return profile.premium_tier || profile.subscription_tier || "";
}

function getAvatarUrl(profile = {}) {
  return profile.avatar_url || profile.profile_photo_url || "";
}

function getPreferredNameField(profile = {}) {
  return NAME_FIELDS.find((field) => Object.prototype.hasOwnProperty.call(profile, field));
}

function tierClass(value = "free") {
  const clean = String(value || "free").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return clean || "free";
}

function hasField(profile = {}, field) {
  return Object.prototype.hasOwnProperty.call(profile, field);
}

export default function MobileAccountPage() {
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileKey, setProfileKey] = useState(null);
  const [form, setForm] = useState({ displayName: "", phone: "", address: "" });
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const t = copy[language] || copy.en;

  const avatarUrl = getAvatarUrl(profile || {});
  const verificationStatus = formatStatus(profile?.verification_status, t.unverified);
  const kycStatus = formatStatus(profile?.kyc_status, t.notStarted);
  const premiumValue = getPremiumValue(profile || {});
  const premiumTier = formatStatus(premiumValue, t.free);
  const isVerified = profile?.verification_status === "verified" || profile?.kyc_status === "verified";
  const isPremium = Boolean(premiumValue && String(premiumValue).toLowerCase() !== "free");

  const supportedFields = useMemo(() => {
    if (!profile) return [];
    return EDITABLE_FIELDS.filter((field) => hasField(profile, field));
  }, [profile]);

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
    let mounted = true;

    async function loadUserAndProfile() {
      setLoading(true);
      setMessage("");

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(currentUser || null);

      if (!currentUser) {
        setProfile(null);
        setProfileKey(null);
        setLoading(false);
        return;
      }

      await loadProfile(currentUser);

      if (mounted) {
        setLoading(false);
      }
    }

    loadUserAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setAuthOpen(false);
        loadProfile(session.user);
      } else {
        setProfile(null);
        setProfileKey(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function loadProfile(currentUser) {
    try {
      const byId = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (byId.error) throw byId.error;

      if (byId.data) {
        applyProfile(byId.data, { column: "id", value: currentUser.id }, currentUser);
        return;
      }

      const byUserId = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (byUserId.error) throw byUserId.error;

      applyProfile(byUserId.data || {}, byUserId.data ? { column: "user_id", value: currentUser.id } : null, currentUser);
    } catch (error) {
      setProfile({});
      setProfileKey(null);
      setMessage(error.message || t.loadError);
      setForm({
        displayName: currentUser?.user_metadata?.full_name || "",
        phone: "",
        address: "",
      });
    }
  }

  function applyProfile(nextProfile, key, currentUser) {
    const nameField = getPreferredNameField(nextProfile);

    setProfile(nextProfile);
    setProfileKey(key);
    setForm({
      displayName:
        (nameField ? nextProfile[nameField] : "") ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.email?.split("@")[0] ||
        "",
      phone: nextProfile.phone || "",
      address: nextProfile.address || "",
    });
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveChanges(event) {
    event.preventDefault();

    if (!user) {
      setAuthOpen(true);
      return;
    }

    if (!profileKey) {
      setMessage(t.noEditable);
      return;
    }

    const payload = {};
    const nameField = getPreferredNameField(profile || {});

    if (nameField) payload[nameField] = form.displayName.trim();
    if (hasField(profile || {}, "phone")) payload.phone = form.phone.trim();
    if (hasField(profile || {}, "address")) payload.address = form.address.trim();

    if (Object.keys(payload).length === 0) {
      setMessage(t.noEditable);
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq(profileKey.column, profileKey.value);

    setSaving(false);

    if (error) {
      setMessage(error.message || t.saveError);
      return;
    }

    setProfile((current) => ({ ...(current || {}), ...payload }));
    setMessage(supportedFields.length < EDITABLE_FIELDS.length ? t.partial : t.saved);
  }

  return (
    <section className="mobileScreenStack mobileAccountPage">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{user?.email || t.signedOut}</p>
        {!user && (
          <button type="button" className="mobilePrimaryButton" onClick={() => setAuthOpen(true)}>
            {t.signIn}
          </button>
        )}
      </div>

      {user && (
        <>
          <section className="mobileAccountSummary">
            <div className="mobileAvatarPanel">
              <div className="mobileAvatarCircle">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <UserRound size={34} />}
              </div>
              <div>
                <strong>{form.displayName || user.email}</strong>
                <p>{t.email}: {user.email}</p>
                <div className="mobileBadgeRow">
                  <span className={isVerified ? "mobileStatusBadge verified" : "mobileStatusBadge unverified"}>
                    <ShieldCheck size={13} />
                    {verificationStatus}
                  </span>
                  <span className={`mobileStatusBadge premium tier-${tierClass(premiumValue || premiumTier)}`}>
                    <Crown size={13} />
                    {premiumTier}
                  </span>
                </div>
              </div>
            </div>
            <p>{t.avatarText}</p>
          </section>

          <section className="mobileAccountStatusGrid">
            <article>
              <span>{t.verification}</span>
              <strong>{verificationStatus}</strong>
            </article>
            <article>
              <span>{t.kyc}</span>
              <strong>{kycStatus}</strong>
            </article>
            <article>
              <span>{t.premium}</span>
              <strong>{premiumTier}</strong>
            </article>
          </section>

          <form className="mobileFormCard mobileAccountForm" onSubmit={saveChanges}>
            <label>
              {t.displayName}
              <input
                value={form.displayName}
                onChange={(event) => updateForm("displayName", event.target.value)}
                disabled={loading || !profile || !NAME_FIELDS.some((field) => hasField(profile, field))}
              />
            </label>

            <label>
              {t.phone}
              <input
                value={form.phone}
                onChange={(event) => updateForm("phone", event.target.value)}
                disabled={loading || !hasField(profile || {}, "phone")}
              />
            </label>

            <label>
              {t.address}
              <textarea
                value={form.address}
                onChange={(event) => updateForm("address", event.target.value)}
                disabled={loading || !hasField(profile || {}, "address")}
              />
            </label>

            <button type="submit" disabled={saving || loading}>
              {saving ? t.saving : t.save}
            </button>

            {message && <p className="mobileAccountMessage">{message}</p>}
          </form>
        </>
      )}

      <div className="mobileActionGrid">
        <Link href="/mobile/people" className="mobileActionCard">
          <UsersRound size={20} />
          <strong>{t.connectedPeople}</strong>
          <p>{t.connectedPeopleText}</p>
        </Link>

        <Link href="/mobile/consent" className="mobileActionCard">
          <ShieldCheck size={20} />
          <strong>{t.consent}</strong>
          <p>{t.consentText}</p>
        </Link>
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </section>
  );
}
