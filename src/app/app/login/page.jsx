"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/app/profile",
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link.");
    }

    setLoading(false);
  }

  return (
    <main className="appShell">
      <section className="appHero compact">
        <p className="appEyebrow">VozEterna Account</p>
        <h1>Sign in</h1>
        <p>Enter your email to receive a secure login link.</p>
      </section>

      <form className="consentBox" onSubmit={handleLogin}>
        <label className="fieldLabel" htmlFor="email">
          Email address
        </label>

        <input
          id="email"
          className="appInput"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <button className="appButton" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send login link"}
        </button>

        {message && <div className="successBox">{message}</div>}

        <p>
          <Link href="/app" className="textLink">
            Back to app
          </Link>
        </p>
      </form>
    </main>
  );
}