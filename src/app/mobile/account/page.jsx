"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function MobileAccountPage() {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email || "");
    }

    loadUser();
  }, []);

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Account</p>
        <h1>Your account</h1>
        <p>{userEmail || "Sign in to manage your private family vault."}</p>
      </div>

      <div className="mobileActionGrid">
        <Link href="/app/account" className="mobileActionCard">
          <strong>Account settings</strong>
          <p>Manage your profile and legal name.</p>
        </Link>

        <Link href="/mobile/consent" className="mobileActionCard">
          <strong>Consent</strong>
          <p>Review consent and authorization records.</p>
        </Link>
      </div>
    </section>
  );
}