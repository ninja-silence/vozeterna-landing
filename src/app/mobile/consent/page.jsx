"use client";

import Link from "next/link";

export default function MobileConsentPage() {
  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Consent</p>
        <h1>Consent & agreements</h1>
        <p>Keep voice, AI, and memorial features grounded in clear family authorization.</p>
      </div>

      <div className="mobileActionGrid">
        <Link href="/app/consent" className="mobileActionCard primary">
          <strong>Review consent</strong>
          <p>Sign or review the active consent agreement.</p>
        </Link>

        <Link href="/app/consent-history" className="mobileActionCard">
          <strong>Consent history</strong>
          <p>View signed records and captured signatures.</p>
        </Link>
      </div>
    </section>
  );
}