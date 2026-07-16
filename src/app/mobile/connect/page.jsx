"use client";

import { useEffect, useState } from "react";
import { Check, Copy, QrCode, Share2, UserPlus, UsersRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../../../lib/supabaseClient";
import {
  getNetworkAccess,
  getVaultAccess,
  loadAccessibleVaults,
  loadExistingNetwork,
} from "../../../lib/mobileVault";
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
    inviteDenied: "Only the vault owner or an admin can invite people to this vault.",
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
    inviteDenied: "Solo el dueno de la boveda o un administrador puede invitar personas a esta boveda.",
  },
};

function normalizeInviteRole(role) {
  return role === "viewer" ? "viewer" : "contributor";
}

async function findFirstManageableNetwork(supabase, user) {
  const vaults = await loadAccessibleVaults(
    supabase,
    user,
    "id, network_id, created_by, created_at"
  );

  for (const vault of vaults) {
    if (!vault.network_id) continue;
    const access = await getVaultAccess(supabase, user, vault);
    if (access.canManage) return vault.network_id;
  }

  return "";
}

export default function MobileConnectPage() {
  const [language, setLanguage] = useState("en");
  const [inviteUrl, setInviteUrl] = useState("");
  const [accountInviteUrl, setAccountInviteUrl] = useState("");
  const [message, setMessage] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [role, setRole] = useState("contributor");
  const [networkType, setNetworkType] = useState("family");

  const t = copy[language] || copy.en;
  const vaultInviteTitle = language === "es" ? "Invitar a esta bóveda" : "Invite to this vault";
  const vaultInviteText =
    language === "es"
      ? "Usa esto para darle acceso a esta bóveda privada."
      : "Use this to give someone access to this private vault.";
  const accountInviteTitle = language === "es" ? "Invitar a VozEterna" : "Invite to VozEterna";
  const accountInviteText =
    language === "es"
      ? "Usa esto cuando alguien necesita crear una cuenta primero. Esto todavía no le da acceso a una bóveda privada."
      : "Use this when someone needs an account first. This does not give access to a private vault yet.";

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
      const inviteRole = normalizeInviteRole(selectedRole);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(t.signIn);
        setLoading(false);
        return;
      }

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const requestedNetworkId = params.get("networkId") || "";
      const requestedVaultId = params.get("vaultId") || "";
      let networkId = "";

      if (requestedVaultId) {
        const { data: targetVault, error: targetVaultError } = await supabase
          .from("vaults")
          .select("id, network_id, created_by")
          .eq("id", requestedVaultId)
          .maybeSingle();

        if (targetVaultError) {
          throw new Error(targetVaultError.message);
        }

        networkId = targetVault?.network_id || "";

        const access = await getVaultAccess(supabase, user, targetVault);
        if (!access.canManage) {
          throw new Error(t.inviteDenied);
        }
      }

      if (!networkId && requestedNetworkId) {
        networkId = requestedNetworkId;
      }

      if (networkId) {
        const existingNetwork = await loadExistingNetwork(supabase, networkId);
        const access = await getNetworkAccess(supabase, user, networkId);

        if (!existingNetwork?.id || !access.canManage) {
          throw new Error(t.inviteDenied);
        }
      } else {
        networkId = await findFirstManageableNetwork(supabase, user);

        if (!networkId) {
          throw new Error(t.inviteDenied);
        }

        const access = await getNetworkAccess(supabase, user, networkId);
        if (!access.canManage) {
          throw new Error(t.inviteDenied);
        }
      }

      const { data, error } = await supabase.rpc("create_sharable_link", {
        target_network_id: networkId,
        target_role: inviteRole,
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

  async function getManageableNetworkContext(selectedNetworkType = networkType) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error(t.signIn);
    }

    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const requestedNetworkId = params.get("networkId") || "";
    const requestedVaultId = params.get("vaultId") || "";
    let networkId = "";

    if (requestedVaultId) {
      const { data: targetVault, error: targetVaultError } = await supabase
        .from("vaults")
        .select("id, network_id, created_by")
        .eq("id", requestedVaultId)
        .maybeSingle();

      if (targetVaultError) {
        throw new Error(targetVaultError.message);
      }

      networkId = targetVault?.network_id || "";

      const access = await getVaultAccess(supabase, user, targetVault);
      if (!access.canManage) {
        throw new Error(t.inviteDenied);
      }
    }

    if (!networkId && requestedNetworkId) {
      networkId = requestedNetworkId;
    }

    if (networkId) {
      const existingNetwork = await loadExistingNetwork(supabase, networkId);
      const access = await getNetworkAccess(supabase, user, networkId);

      if (!existingNetwork?.id || !access.canManage) {
        throw new Error(t.inviteDenied);
      }

      return { user, networkId };
    }

    const fallbackNetworkId = await findFirstManageableNetwork(supabase, user);

    if (!fallbackNetworkId) {
      throw new Error(t.inviteDenied);
    }

    const access = await getNetworkAccess(supabase, user, fallbackNetworkId);

    if (!access.canManage) {
      throw new Error(t.inviteDenied);
    }

    return { user, networkId: fallbackNetworkId };
  }

  async function createAccountInvite() {
    setAccountLoading(true);
    setAccountMessage("");
    setAccountInviteUrl("");

    try {
      const { user } = await getManageableNetworkContext(networkType);
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from("account_invites").insert({
        token,
        created_by: user.id,
        status: "active",
        max_uses: 1,
        used_count: 0,
        expires_at: expiresAt,
      });

      if (error) {
        throw new Error(error.message);
      }

      setAccountInviteUrl(`${window.location.origin}/mobile/account-invite/${token}`);
      setAccountMessage(language === "es" ? "Invitación de cuenta creada." : "Account invite created.");
    } catch (error) {
      setAccountMessage(error.message || "Could not create account invite.");
    } finally {
      setAccountLoading(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;

    await navigator.clipboard.writeText(inviteUrl);
    setMessage(t.copied);
  }

  async function copyAccountInvite() {
    if (!accountInviteUrl) return;

    await navigator.clipboard.writeText(accountInviteUrl);
    setAccountMessage(language === "es" ? "Invitación de cuenta copiada." : "Account invite copied.");
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

  async function shareAccountInvite() {
    if (!accountInviteUrl) return;

    const shareData = {
      title: accountInviteTitle,
      text: accountInviteText,
      url: accountInviteUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await copyAccountInvite();
    } catch (error) {
      if (error?.name !== "AbortError") {
        await copyAccountInvite();
      }
    }
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{vaultInviteTitle}</h1>
        <p>{vaultInviteText}</p>
      </div>

      <section className="mobileConnectCard">
        <div className="mobileInviteText">
          <UsersRound size={18} />
          <p>
            <strong>{vaultInviteTitle}</strong>
            <br />
            {vaultInviteText}
          </p>
        </div>

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

      <section className="mobileConnectCard">
        <div className="mobileInviteText">
          <UserPlus size={18} />
          <p>
            <strong>{accountInviteTitle}</strong>
            <br />
            {accountInviteText}
          </p>
        </div>

        <div className="mobileQrBox">
          {accountLoading ? (
            <div className="mobileQrLoading">
              <UserPlus size={44} />
              <p>{language === "es" ? "Creando invitación de cuenta..." : "Creating account invite..."}</p>
            </div>
          ) : accountInviteUrl ? (
            <QRCodeSVG value={accountInviteUrl} size={210} level="M" includeMargin />
          ) : (
            <div className="mobileQrLoading">
              <UserPlus size={44} />
              <p>{language === "es" ? "Todavía no hay invitación de cuenta." : "No account invite yet."}</p>
            </div>
          )}
        </div>

        <div className="mobileConnectActions">
          <button type="button" onClick={createAccountInvite} disabled={accountLoading}>
            <UserPlus size={17} />
            {accountInviteTitle}
          </button>

          <button type="button" onClick={copyAccountInvite} disabled={!accountInviteUrl}>
            <Copy size={17} />
            {language === "es" ? "Copiar invitación de cuenta" : "Copy account invite"}
          </button>

          <button type="button" onClick={shareAccountInvite} disabled={!accountInviteUrl}>
            <Share2 size={17} />
            {language === "es" ? "Compartir invitación de cuenta" : "Share account invite"}
          </button>
        </div>

        {accountMessage && (
          <p className="mobileSuccessMessage">
            <Check size={16} />
            <span>{accountMessage}</span>
          </p>
        )}
      </section>
    </section>
  );
}
