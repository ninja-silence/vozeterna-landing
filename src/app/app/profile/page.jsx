"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    }

    getUser();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/app/login";
  }

  if (loading) {
    return (
      <main className="appShell">
        <p>Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Profile</p>
          <h1>You are not signed in</h1>
          <p>Please sign in before uploading memories.</p>
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
        <p className="appEyebrow">Profile</p>
        <h1>Your VozEterna Profile</h1>
        <p>You are signed in as:</p>
      </section>

      <section className="consentBox">
        <h2>{user.email}</h2>

        <div className="buttonRow">
          <Link href="/app/upload" className="appButton">
            Upload memories
          </Link>

          <Link href="/app/record" className="appButton secondary">
            Record memories
          </Link>

          <button className="appButton danger" onClick={signOut}>
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}