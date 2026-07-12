"use client";

import { useEffect, useState } from "react";
import { Check, Copy, QrCode, Share2, UsersRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../../../lib/supabaseClient";
import { ensureNetworkAndVaultByType } from "../../../lib/mobileVault";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "Connect",
    title: "Invite family or friends",
    subtitle: "Create a private QR invite link for people you trust. This does not make your vault public.",
    family: "Family",
    friends: "Friends",
    viewer: "Viewer",
    contributor: "Contributor",
    loading: "Creating secure invite...",
    noInvite: "No invite link yet.",
    viewerText: "can view private updates.",
    contributorText: "can add memories and reflections.",
    copy: "Copy link",
    share: "Share invite",
    copied: "Invite link copied.",
    signIn: "Please sign in before creating an invite.",
  },
  es: {
    label: "Conectar",
    title: "Invita familia o amigos",
    subtitle: "Crea un código QR privado para personas de confianza. Esto no hace pública tu bóveda.",
    family: "Familia",
    friends: "Amigos",
    viewer: "Visitante",
    contributor: "Colaborador",
    loading: "Creando invitación segura...",
    noInvite: "Todavía no hay enlace.",
    viewerText: "puede ver actualizaciones privadas.",
    contributorText: "puede agregar recuerdos y reflexiones.",
    copy: "Copiar enlace",
    share: "Compartir invitación",
    copied: "Enlace copiado.",
    signIn: "Inicia sesión antes de crear una invitación.",
  },
};

export default function MobileConnectPage() {
  const [language, setLanguage] = useState("en");
  const [inviteUrl, setInviteUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("contributor");
  const [networkType, setNetworkType] = useState("family");

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
    createInvite(networkType, role);
  }, [networkType, role]);

  async function createInvite(selectedNetworkType = networkType, selectedRole = role) {
    setLoading(true);
    setMessage("");
    setInviteUrl("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(t.signIn);
        setLoading(false);
        return;
      }

      const { networkId } = await ensureNetworkAndVaultByType(
        supabase,
        user,
        selectedNetworkType
      );

      const { data, error } = await supabase.rpc("create_sharable_link", {
        target_network_id: networkId,
        target_role: selectedRole,
      });

      if (error) {
        throw new Error(error.message);
      }

      const token = data?.token;

      if (!token) {
        throw new Error("Invite token was not created.");
      }

      setInviteUrl(`${window.location.origin}/mobile/invite/${token}`);
    } catch (error) {
      setMessage(error.message || "Could not create invite.");
    } finally {
      setLoading(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;

    await navigator.clipboard.writeText(inviteUrl);
    setMessage(t.copied);
  }

  async function shareInvite() {
    if (!inviteUrl) return;

    const shareData = {
      title: "Join my VozEterna network",
      text: "I’m inviting you to contribute to my private VozEterna archive.",
      url: inviteUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await copyInvite();
    } catch (error) {
      if (error?.name !== "AbortError") {
        await copyInvite();
      }
    }
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="mobileConnectCard">
        <div className="mobileRoleSwitch">
          <button
            type="button"
            className={networkType === "family" ? "active" : ""}
            onClick={() => setNetworkType("family")}
          >
            {t.family}
          </button>

          <button
            type="button"
            className={networkType === "friend" ? "active" : ""}
            onClick={() => setNetworkType("friend")}
          >
            {t.friends}
          </button>
        </div>

        <div className="mobileRoleSwitch">
          <button
            type="button"
            className={role === "viewer" ? "active" : ""}
            onClick={() => setRole("viewer")}
          >
            {t.viewer}
          </button>

          <button
            type="button"
            className={role === "contributor" ? "active" : ""}
            onClick={() => setRole("contributor")}
          >
            {t.contributor}
          </button>
        </div>

        <div className="mobileQrBox">
          {loading ? (
            <div className="mobileQrLoading">
              <QrCode size={44} />
              <p>{t.loading}</p>
            </div>
          ) : inviteUrl ? (
            <QRCodeSVG value={inviteUrl} size={210} level="M" includeMargin />
          ) : (
            <div className="mobileQrLoading">
              <QrCode size={44} />
              <p>{t.noInvite}</p>
            </div>
          )}
        </div>

        <div className="mobileInviteText">
          <UsersRound size={18} />
          <p>
            <strong>
              {networkType === "family" ? t.family : t.friends} ·{" "}
              {role === "viewer" ? t.viewer : t.contributor}
            </strong>{" "}
            {role === "viewer" ? t.viewerText : t.contributorText}
          </p>
        </div>

        <div className="mobileConnectActions">
          <button type="button" onClick={copyInvite} disabled={!inviteUrl}>
            <Copy size={17} />
            {t.copy}
          </button>

          <button type="button" onClick={shareInvite} disabled={!inviteUrl}>
            <Share2 size={17} />
            {t.share}
          </button>
        </div>

        {message && (
          <p className="mobileSuccessMessage">
            <Check size={16} />
            <span>{message}</span>
          </p>
        )}
      </section>
    </section>
  );
}