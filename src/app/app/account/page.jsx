"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [legalFullName, setLegalFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadAccount() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("legal_full_name")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (data?.legal_full_name) {
        setLegalFullName(data.legal_full_name);
      }

      setLoading(false);
    }

    loadAccount();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("Please sign in first.");
      return;
    }

    if (legalFullName.trim().length < 5) {
      setMessage("Please enter your full legal name.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id,
      legal_full_name: legalFullName.trim(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Account profile saved.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Account</p>
          <h1>Loading...</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Account</p>
          <h1>Please sign in</h1>
          <p>You need to sign in before setting up your account profile.</p>

          <Link href="/app/login" className="appButton">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section className="appHero compact">
        <p className="appEyebrow">Account Setup</p>
        <h1>Your Legal Name</h1>
        <p>
          This name will be used for consent records and signature verification inside VozEterna.
        </p>
      </section>

      <form className="consentBox" onSubmit={handleSubmit}>
        <label className="fieldLabel" htmlFor="legalFullName">
          Full legal name
        </label>

        <input
          id="legalFullName"
          className="appInput"
          value={legalFullName}
          onChange={(e) => setLegalFullName(e.target.value)}
          placeholder="Example: Felipe Frias"
        />

        <div className="buttonRow">
          <button className="appButton" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save account profile"}
          </button>

          <Link href="/app/consent" className="appButton secondary">
            Continue to consent
          </Link>
        </div>

        {message && <div className="successBox">{message}</div>}
      </form>
    </main>
  );
}