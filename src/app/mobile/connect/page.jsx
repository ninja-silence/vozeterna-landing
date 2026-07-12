"use client";

import { useEffect, useState } from "react";
import { Check, Copy, QrCode, Share2, UsersRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../../../lib/supabaseClient";
import { ensureDefaultNetworkAndVault } from "../../../lib/mobileVault";

export default function MobileConnectPage() {
  const [inviteUrl, setInviteUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("viewer");

  function readNetworkIdFromUrl() {
    if (typeof window === "undefined") return "";

    return new URLSearchParams(window.location.search).get("networkId") || "";
  }

  useEffect(() => {
    createInvite();
  }, []);

  async function createInvite(selectedRole = role) {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in before creating an invite.");
        setLoading(false);
        return;
      }

      const queryNetworkId = readNetworkIdFromUrl();
      const ensured = queryNetworkId
        ? { networkId: queryNetworkId }
        : await ensureDefaultNetworkAndVault(supabase, user);

      const networkId = ensured.networkId;

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
    setMessage("Invite link copied.");
  }

  async function shareInvite() {
    if (!inviteUrl) return;

    const shareData = {
      title: "Join my VozEterna family network",
      text: "I’m inviting you to contribute to my private VozEterna family archive.",
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

  function changeRole(nextRole) {
    setRole(nextRole);
    createInvite(nextRole);
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Connect</p>
        <h1>Invite family or friends</h1>
        <p>Create a private QR invite link for people you trust. This does not make your vault public.</p>
      </div>

      <section className="mobileConnectCard">
        <div className="mobileRoleSwitch">
          <button
            type="button"
            className={role === "viewer" ? "active" : ""}
            onClick={() => changeRole("viewer")}
          >
            Viewer
          </button>

          <button
            type="button"
            className={role === "contributor" ? "active" : ""}
            onClick={() => changeRole("contributor")}
          >
            Contributor
          </button>
        </div>

        <div className="mobileQrBox">
          {loading ? (
            <div className="mobileQrLoading">
              <QrCode size={44} />
              <p>Creating secure invite...</p>
            </div>
          ) : inviteUrl ? (
            <QRCodeSVG value={inviteUrl} size={210} level="M" includeMargin />
          ) : (
            <div className="mobileQrLoading">
              <QrCode size={44} />
              <p>No invite link yet.</p>
            </div>
          )}
        </div>

        <div className="mobileInviteText">
          <UsersRound size={18} />
          <p>
            <strong>{role === "viewer" ? "Viewer" : "Contributor"}</strong>
            {role === "viewer"
              ? " can view private family updates."
              : " can add memories and reflections."}
          </p>
        </div>

        <div className="mobileConnectActions">
          <button type="button" onClick={copyInvite} disabled={!inviteUrl}>
            <Copy size={17} />
            Copy link
          </button>

          <button type="button" onClick={shareInvite} disabled={!inviteUrl}>
            <Share2 size={17} />
            Share invite
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