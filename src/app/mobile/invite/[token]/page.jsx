"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";
import { useParams } from "next/navigation";
import AuthModal from "../../../../components/auth/AuthModal";
import { supabase } from "../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";
import { loadExistingNetwork } from "../../../../lib/mobileVault";

const copy = {
  en: {
    label: "Private Invite",
    title: "Join private network",
    subtitle: "Someone invited you to connect inside VozEterna.",
    question: "Choose how you are joining, then accept this private invite.",
    relationship: "Relationship",
    family: "Family",
    friend: "Friend",
    other: "Other",
    accept: "Accept invite",
    accepting: "Connecting...",
    success: "You joined the private network.",
    error: "This invite could not be accepted.",
    expired: "This invite is no longer valid.",
    signIn: "Please log in or create an account before accepting this invite.",
    login: "Log in / Create account",
    goFeed: "Go to feed",
    home: "VozEterna",
    privacy: "Invite-only access. This does not make the vault public.",
  },
  es: {
    label: "Invitacion privada",
    title: "Unirse a red privada",
    subtitle: "Alguien te invito a conectarte dentro de VozEterna.",
    question: "Elige como te unes y acepta esta invitacion privada.",
    relationship: "Relacion",
    family: "Familia",
    friend: "Amigo",
    other: "Otra",
    accept: "Aceptar invitacion",
    accepting: "Conectando...",
    success: "Te uniste a la red privada.",
    error: "No se pudo aceptar esta invitacion.",
    expired: "Esta invitacion ya no es valida.",
    signIn: "Inicia sesion o crea una cuenta antes de aceptar esta invitacion.",
    login: "Iniciar sesion / Crear cuenta",
    goFeed: "Ir al feed",
    home: "VozEterna",
    privacy: "Acceso solo por invitacion. Esto no hace publica la boveda.",
  },
};

function extractNetworkId(value) {
  if (!value) return "";

  const row = Array.isArray(value) ? value[0] : value;

  return (
    row?.network_id ||
    row?.target_network_id ||
    row?.network?.id ||
    ""
  );
}

function getInviteRole(value) {
  const row = Array.isArray(value) ? value[0] : value;
  const role = String(row?.target_role || row?.role || "").toLowerCase();
  return ["owner", "admin", "manager", "contributor", "viewer"].includes(role) ? role : "contributor";
}

export default function MobileInvitePage() {
  const params = useParams();
  const token = params?.token;

  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState("");
  const [relationshipType, setRelationshipType] = useState("family");
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);

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
    let mounted = true;

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(currentUser || null);
      }
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setAuthOpen(false);
        setStatus("ready");
        setMessage("");
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function loadInviteNetworkId(rpcData) {
    const rpcNetworkId = extractNetworkId(rpcData);
    if (rpcNetworkId) return rpcNetworkId;

    const { data } = await supabase
      .from("sharable_links")
      .select("network_id, target_network_id")
      .eq("token", token)
      .maybeSingle();

    return extractNetworkId(data);
  }

  async function loadInviteDetails(rpcData) {
    const rpcNetworkId = extractNetworkId(rpcData);
    const rpcRole = getInviteRole(rpcData);
    const { data: baseLink, error: baseError } = await supabase
      .from("sharable_links")
      .select("network_id, target_network_id")
      .eq("token", token)
      .maybeSingle();

    if (baseError) {
      console.warn("[VozEterna] Invite base lookup failed:", baseError.message);
    }

    let roleLink = null;
    const { data: targetRoleLink, error: targetRoleError } = await supabase
      .from("sharable_links")
      .select("target_role")
      .eq("token", token)
      .maybeSingle();

    if (!targetRoleError && targetRoleLink) {
      roleLink = targetRoleLink;
    } else {
      const { data: fallbackRoleLink, error: fallbackRoleError } = await supabase
        .from("sharable_links")
        .select("role")
        .eq("token", token)
        .maybeSingle();

      if (!fallbackRoleError && fallbackRoleLink) {
        roleLink = fallbackRoleLink;
      } else if (targetRoleError && fallbackRoleError) {
        console.warn("[VozEterna] Invite role lookup skipped:", targetRoleError.message);
      }
    }

    const networkId = rpcNetworkId || extractNetworkId(baseLink);
    const role = getInviteRole(roleLink || rpcData) || rpcRole;

    let vaultId = "";
    if (networkId) {
      const { data: vaultRow, error: vaultError } = await supabase
        .from("vaults")
        .select("id")
        .eq("network_id", networkId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (vaultError) {
        console.warn("[VozEterna] Invite vault lookup failed:", vaultError.message);
      }

      vaultId = vaultRow?.id || "";
    }

    console.info("[VozEterna] Invite resolved", {
      hasToken: Boolean(token),
      networkId,
      vaultId,
      role,
    });

    return { networkId, vaultId, role };
  }

  async function ensureNetworkMembership({ networkId, currentUser, role }) {
    if (!networkId || !currentUser?.id) return;

    const existing = await supabase
      .from("network_members")
      .select("network_id")
      .eq("network_id", networkId)
      .eq("user_id", currentUser.id)
      .limit(1)
      .maybeSingle();

    const values = {
      role,
      invited_by: currentUser.id,
      accepted_at: new Date().toISOString(),
      relationship_type: relationshipType,
    };

    const result = existing.data?.network_id
      ? await supabase
          .from("network_members")
          .update(values)
          .eq("network_id", networkId)
          .eq("user_id", currentUser.id)
      : await supabase.from("network_members").insert({
          network_id: networkId,
          user_id: currentUser.id,
          ...values,
        });

    if (result.error && /relationship_type/i.test(result.error.message || "")) {
      const fallbackValues = {
        role,
        invited_by: currentUser.id,
        accepted_at: new Date().toISOString(),
      };

      const fallbackResult = existing.data?.network_id
        ? await supabase
            .from("network_members")
            .update(fallbackValues)
            .eq("network_id", networkId)
            .eq("user_id", currentUser.id)
        : await supabase.from("network_members").insert({
            network_id: networkId,
            user_id: currentUser.id,
            ...fallbackValues,
          });

      if (fallbackResult.error) throw new Error(fallbackResult.error.message);
      return;
    }

    if (result.error) throw new Error(result.error.message);
  }

  async function ensureVaultMembership({ vaultId, currentUser, role }) {
    if (!vaultId || !currentUser?.id) return;

    const existing = await supabase
      .from("vault_memberships")
      .select("vault_id")
      .eq("vault_id", vaultId)
      .eq("user_id", currentUser.id)
      .limit(1)
      .maybeSingle();

    if (existing.error) {
      console.warn("[VozEterna] Vault membership lookup skipped:", existing.error.message);
      return;
    }

    const result = existing.data?.vault_id
      ? await supabase
          .from("vault_memberships")
          .update({ role })
          .eq("vault_id", vaultId)
          .eq("user_id", currentUser.id)
      : await supabase.from("vault_memberships").insert({
          vault_id: vaultId,
          user_id: currentUser.id,
          role,
        });

    if (result.error) {
      console.warn("[VozEterna] Vault membership write skipped:", result.error.message);
    }
  }

  async function saveRelationshipMetadata(networkId, currentUser) {
    if (!networkId || !currentUser?.id) return;

    const existingNetwork = await loadExistingNetwork(supabase, networkId);
    if (!existingNetwork?.id) {
      throw new Error(t.expired);
    }

    await supabase
      .from("network_members")
      .update({ relationship_type: relationshipType })
      .eq("network_id", networkId)
      .eq("user_id", currentUser.id);

    await supabase.from("network_activity").insert({
      network_id: networkId,
      actor_id: currentUser.id,
      activity_type: "member_joined",
      title: `${currentUser.email || "A member"} joined the network`,
      feed_visibility: "network",
      is_commentable: false,
      metadata: {
        source: "mobile_invite",
        relationship_type: relationshipType,
      },
    });
  }

  async function acceptInvite() {
    setStatus("accepting");
    setMessage("");

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setStatus("signin");
      setMessage(t.signIn);
      setAuthOpen(true);
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage(t.error);
      return;
    }

    const networkIdFromLink = await loadInviteNetworkId(null);
    const existingNetwork = await loadExistingNetwork(supabase, networkIdFromLink);

    if (!networkIdFromLink || !existingNetwork?.id) {
      setStatus("error");
      setMessage(t.expired);
      return;
    }

    const { data, error } = await supabase.rpc("accept_sharable_link", {
      invite_token: token,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message || t.error);
      return;
    }

    const networkId = extractNetworkId(data) || networkIdFromLink;
    const inviteDetails = await loadInviteDetails(data);
    const resolvedNetworkId = inviteDetails.networkId || networkId;

    try {
      await ensureNetworkMembership({
        networkId: resolvedNetworkId,
        currentUser,
        role: inviteDetails.role,
      });
      await ensureVaultMembership({
        vaultId: inviteDetails.vaultId,
        currentUser,
        role: inviteDetails.role,
      });
      await saveRelationshipMetadata(resolvedNetworkId, currentUser);
    } catch (metadataError) {
      if (metadataError.message === t.expired) {
        setStatus("error");
        setMessage(t.expired);
        return;
      }
      // Older schemas may not expose relationship_type or activity writes here.
      // Acceptance still succeeds through the existing RPC.
    }

    setUser(currentUser);
    setStatus("success");
    setMessage(t.success);
  }

  const feedHref = relationshipType === "friend" ? "/mobile/feed?type=friend" : "/mobile/feed?type=family";

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
          {status === "success"
            ? t.success
            : status === "signin" || status === "error"
              ? message
              : t.question}
        </h2>

        {status !== "success" && (
          <div className="mobileInviteRelationship">
            <p className="mobileCapsLabel">{t.relationship}</p>
            <div className="mobileRoleSwitch">
              <button
                type="button"
                className={relationshipType === "family" ? "active" : ""}
                onClick={() => setRelationshipType("family")}
              >
                {t.family}
              </button>
              <button
                type="button"
                className={relationshipType === "friend" ? "active" : ""}
                onClick={() => setRelationshipType("friend")}
              >
                {t.friend}
              </button>
              <button
                type="button"
                className={relationshipType === "other" ? "active" : ""}
                onClick={() => setRelationshipType("other")}
              >
                {t.other}
              </button>
            </div>
          </div>
        )}

        <div className="mobileConsentNotice">
          <ShieldCheck size={20} />
          <p>{t.privacy}</p>
        </div>

        {(status === "ready" || status === "signin") && user && (
          <button type="button" onClick={acceptInvite} className="mobileRecorderPrimary">
            {t.accept}
          </button>
        )}

        {(status === "ready" || status === "signin") && !user && (
          <button type="button" onClick={() => setAuthOpen(true)} className="mobileRecorderPrimary">
            {t.login}
          </button>
        )}

        {status === "accepting" && (
          <button type="button" disabled className="mobileRecorderPrimary">
            {t.accepting}
          </button>
        )}

        {status === "success" && (
          <Link href={feedHref} className="mobileRecorderPrimary">
            {t.goFeed}
          </Link>
        )}

        {status === "error" && (
          <Link href="/mobile" className="mobileRecorderSecondary">
            {t.home}
          </Link>
        )}
      </section>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </section>
  );
}
