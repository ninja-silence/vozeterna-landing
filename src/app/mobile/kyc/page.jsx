"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

export default function MobileKycPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const activeSession = sessionData?.session || null;

    setSession(activeSession);

    if (!activeSession?.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, legal_name, is_premium, kyc_status, kyc_verified_at")
      .eq("id", activeSession.user.id)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
    }

    setProfile(data || null);
    setLoading(false);
  }

  async function markPending() {
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      setMessage("Please log in first.");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      kyc_status: "pending",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("KYC marked as pending. Full verification provider will be connected later.");
    loadProfile();
  }

  const status = profile?.kyc_status || "not_started";

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">
          <ShieldCheck size={15} />
          KYC / Premium
        </p>
        <h1>Identity verification</h1>
        <p>
          Premium features like cloned voice narration will require identity verification and clear consent.
        </p>
      </div>

      <section className="mobileFormCard mobileKycCard">
        <div className="mobileInviteIcon">
          <BadgeCheck size={24} />
        </div>

        {loading ? (
          <p className="mobileFormHelper">Loading...</p>
        ) : !session ? (
          <>
            <h2>Please log in first</h2>
            <p className="mobileFormHelper">
              Open the menu and choose Log in / Create account before starting KYC.
            </p>
            <Link href="/mobile" className="mobilePrimaryButton">
              Back to mobile app
            </Link>
          </>
        ) : (
          <>
            <p className="mobileCapsLabel">Current status</p>
            <h2>{status.replace("_", " ")}</h2>

            <button type="button" onClick={markPending}>
              Start KYC
            </button>

            {message && <p className="mobileFormMessage">{message}</p>}
          </>
        )}
      </section>
    </section>
  );
}