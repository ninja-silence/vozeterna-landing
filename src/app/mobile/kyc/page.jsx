"use client";

import Link from "next/link";
import { BadgeCheck, ShieldCheck } from "lucide-react";

export default function MobileKycPage() {
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

        <h2>KYC coming soon</h2>
        <p className="mobileFormHelper">
          For now, users can log in and upload memories. KYC will be required later for premium AI voice features.
        </p>

        <Link href="/mobile" className="mobilePrimaryButton">
          Back to app
        </Link>
      </section>
    </section>
  );
}