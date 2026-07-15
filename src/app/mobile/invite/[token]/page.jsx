"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import AuthModal from "../../../../components/auth/AuthModal";
import { supabase } from "../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";
import { getNetworkAccess, getVaultAccess } from "../../../../lib/mobileVault";

const copy = {
  en: {
    label: "Private Invite",
    title: "Join private network",
    subtitle: "Someone invited you to connect inside VozEterna.",
    question: "Choose how you are joining, then accept this private invite.",
    invitedVault: "Invited vault",
    inviter: "Invited by",
    network: "Network",
    role: "Role",
    relationship: "Relationship",
    family: "Family",
    friend: "Friend",
    other: "Other",
    accept: "Join vault",
    accepting: "Connecting...",
    success: "You joined the vault.",
    error: "This invite could not be accepted.",
    membershipError: "We couldn't accept this invite. Please ask the person who invited you to send a new link.",
    loading: "Loading invite...",
    invalid: "This invite does not look valid.",
    expired: "This invite is no longer valid.",
    maxUses: "This invite has already been used the maximum number of times.",
    missingNetwork: "The invite network could not be found.",
    missingVault: "The invite vault could not be found.",
    signIn: "Please log in or create an account before accepting this invite.",
    login: "Log in / Create account",
    authHelper: "Create your account or sign in to accept this family vault invitation.",
    goVault: "Open vault",
    home: "VozEterna",
    privacy: "Invite-only access. This does not make the vault public.",
  },
  es: {
    label: "Invitacion privada",
    title: "Unirse a red privada",
    subtitle: "Alguien te invito a conectarte dentro de VozEterna.",
    question: "Elige como te unes y acepta esta invitacion privada.",
    invitedVault: "Boveda invitada",
    inviter: "Invitado por",
    network: "Red",
    role: "Rol",
    relationship: "Relacion",
    family: "Familia",
    friend: "Amigo",
    other: "Otra",
    accept: "Unirme a boveda",
    accepting: "Conectando...",
    success: "Te uniste a la boveda.",
    error: "No se pudo aceptar esta invitacion.",
    membershipError: "No pudimos aceptar esta invitación. Pídele a quien te invitó que te envíe un nuevo enlace.",
    loading: "Cargando invitacion...",
    invalid: "Esta invitacion no parece valida.",
    expired: "Esta invitacion ya no es valida.",
    maxUses: "Esta invitacion ya alcanzo su limite de usos.",
    missingNetwork: "No se encontro la red de esta invitacion.",
    missingVault: "No se encontro la boveda de esta invitacion.",
    signIn: "Inicia sesion o crea una cuenta antes de aceptar esta invitacion.",
    login: "Iniciar sesion / Crear cuenta",
    authHelper: "Crea tu cuenta o inicia sesión para aceptar esta invitación a la bóveda familiar.",
    goVault: "Abrir boveda",
    home: "VozEterna",
    privacy: "Acceso solo por invitacion. Esto no hace publica la boveda.",
  },
};

function getInviteRole(value) {
  const row = Array.isArray(value) ? value[0] : value;
  const role = String(row?.invite_role || "").toLowerCase();
  return ["admin", "manager", "contributor", "viewer"].includes(role) ? role : "";
}

export default function MobileInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token;

  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState("");
  const [relationshipType, setRelationshipType] = useState("family");
  const [inviteDetails, setInviteDetails] = useState(null);
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

  useEffect(() => {
    let mounted = true;

    async function loadInvite() {
      setStatus("loading");
      setMessage("");

      try {
        const details = await loadInviteDetails();

        if (mounted) {
          setInviteDetails(details);
          setStatus("ready");
        }
      } catch (error) {
        if (mounted) {
          setInviteDetails(null);
          setStatus("error");
          setMessage(error.message || t.error);
        }
      }
    }

    loadInvite();

    return () => {
      mounted = false;
    };
  }, [token, language]);

  async function loadInviteDetails() {
    if (!token) {
      throw new Error(t.invalid);
    }

    const { data: inviteResult, error: inviteError } = await supabase.rpc(
      "get_vault_invite_by_token",
      { invite_token: token }
    );

    if (inviteError) {
      throw new Error(t.invalid);
    }

    const link = Array.isArray(inviteResult) ? inviteResult[0] : inviteResult;

    if (!link?.token || !link.network_id) {
      throw new Error(t.invalid);
    }

    const inviteRole = getInviteRole(link);
    if (!inviteRole) {
      throw new Error(t.invalid);
    }

    if (!link.vault_id) {
      throw new Error(t.missingVault);
    }

    const details = {
      link,
      network: { id: link.network_id, name: link.network_name || "", type: "family" },
      vault: {
        id: link.vault_id,
        network_id: link.network_id,
        title: link.vault_title || t.invitedVault,
        description: link.vault_description || "",
      },
      inviterName: "",
      role: inviteRole,
    };

    console.info("[VozEterna] Invite loaded", {
      hasToken: Boolean(token),
      networkId: link.network_id,
      vaultId: link.vault_id,
      role: details.role,
    });

    return details;
  }

  async function ensureNetworkMembership({ networkId, currentUser, role, invitedBy }) {
    if (!networkId || !currentUser?.id) return false;

    const existing = await supabase
      .from("network_members")
      .select("network_id")
      .eq("network_id", networkId)
      .eq("user_id", currentUser.id)
      .limit(1)
      .maybeSingle();

    if (existing.data?.network_id) return false;

    const result = await supabase.from("network_members").insert({
      network_id: networkId,
      user_id: currentUser.id,
      role,
      invited_by: invitedBy || currentUser.id,
      accepted_at: new Date().toISOString(),
      relationship_type: relationshipType,
    });

    if (result.error && /relationship_type/i.test(result.error.message || "")) {
      const fallbackValues = {
        role,
        invited_by: invitedBy || currentUser.id,
        accepted_at: new Date().toISOString(),
      };

      const fallbackResult = await supabase.from("network_members").insert({
        network_id: networkId,
        user_id: currentUser.id,
        ...fallbackValues,
      });

      if (fallbackResult.error) {
        const access = await getNetworkAccess(supabase, currentUser, networkId);
        if (access.canView) return false;
        throw new Error(t.membershipError);
      }
      return true;
    }

    if (result.error) {
      const access = await getNetworkAccess(supabase, currentUser, networkId);
      if (access.canView) return false;
      throw new Error(t.membershipError);
    }
    return true;
  }

  async function ensureVaultMembership({ vaultId, currentUser, role, invitedBy }) {
    if (!vaultId || !currentUser?.id) return false;

    const existing = await supabase
      .from("vault_memberships")
      .select("vault_id")
      .eq("vault_id", vaultId)
      .eq("user_id", currentUser.id)
      .limit(1)
      .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data?.vault_id) return false;

    const result = await supabase.from("vault_memberships").insert({
      vault_id: vaultId,
      user_id: currentUser.id,
      role,
      invited_by: invitedBy || currentUser.id,
      accepted_at: new Date().toISOString(),
    });

    if (result.error) {
      throw result.error;
    }

    return !existing.data?.vault_id;
  }

  async function saveRelationshipMetadata(networkId, currentUser) {
    if (!networkId || !currentUser?.id) return;

    const access = await getNetworkAccess(supabase, currentUser, networkId);
    if (!access.canView) {
      throw new Error(t.expired);
    }

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

  async function incrementInviteUsedCount(link) {
    if (!link?.token) return;

    const { error } = await supabase
      .from("sharable_links")
      .update({ used_count: (link.used_count || 0) + 1 })
      .eq("token", link.token);

    if (error) {
      console.warn("[VozEterna] Invite used_count update failed:", error.message);
    }
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

    try {
      const details = inviteDetails || (await loadInviteDetails());
      const networkId = details.link.network_id;
      const vaultId = details.vault.id;
      const wasNetworkCreated = await ensureNetworkMembership({
        networkId,
        currentUser,
        role: details.role,
        invitedBy: details.link.created_by,
      });
      let wasVaultCreated = false;
      try {
        wasVaultCreated = await ensureVaultMembership({
          vaultId,
          currentUser,
          role: details.role,
          invitedBy: details.link.created_by,
        });
      } catch (vaultMembershipError) {
        const [vaultAccess, networkAccess] = await Promise.all([
          getVaultAccess(supabase, currentUser, details.vault),
          getNetworkAccess(supabase, currentUser, networkId),
        ]);

        if (!vaultAccess.canView && !networkAccess.canView) {
          throw new Error(t.membershipError);
        }

        console.warn("[VozEterna] vault_memberships invite acceptance skipped after existing access check:", {
          message: vaultMembershipError?.message || vaultMembershipError,
          code: vaultMembershipError?.code,
          details: vaultMembershipError?.details,
          hint: vaultMembershipError?.hint,
        });
      }

      if (wasNetworkCreated || wasVaultCreated) {
        await incrementInviteUsedCount(details.link);
      }

      try {
        await saveRelationshipMetadata(networkId, currentUser);
      } catch (activityError) {
        console.warn("[VozEterna] Invite activity metadata skipped:", activityError.message);
      }

      setUser(currentUser);
      setStatus("success");
      setMessage(t.success);
      router.push(`/mobile/profiles/${vaultId}`);
    } catch (acceptError) {
      setStatus("error");
      setMessage(acceptError.message || t.error);
    }
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
          {status === "success"
            ? t.success
            : status === "loading"
              ? t.loading
            : status === "signin" || status === "error"
              ? message
              : t.question}
        </h2>

        {inviteDetails && status !== "error" && (
          <div className="mobileInviteText">
            <UsersRound size={18} />
            <p>
              <span className="mobileCapsLabel">{t.invitedVault}</span>
              <strong>{inviteDetails?.vault?.title || inviteDetails?.network?.name || t.title}</strong>
              {inviteDetails.inviterName && (
                <>
                  <br />
                  {t.inviter}: {inviteDetails.inviterName}
                </>
              )}
              {inviteDetails.network?.name && (
                <>
                  <br />
                  {t.network}: {inviteDetails.network.name}
                </>
              )}
              <br />
              {t.role}: {inviteDetails.role}
            </p>
          </div>
        )}

        {status !== "success" && status !== "loading" && status !== "error" && (
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

        {(status === "ready" || status === "signin") && user && inviteDetails && (
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
          <Link href={`/mobile/profiles/${inviteDetails?.vault?.id || ""}`} className="mobileRecorderPrimary">
            {t.goVault}
          </Link>
        )}

        {status === "error" && (
          <Link href="/mobile" className="mobileRecorderSecondary">
            {t.home}
          </Link>
        )}
      </section>

      {authOpen && inviteDetails && status !== "error" && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          allowSignup={true}
          language={language}
          helperText={t.authHelper}
          redirectTo={`/mobile/invite/${token}`}
        />
      )}
    </section>
  );
}
