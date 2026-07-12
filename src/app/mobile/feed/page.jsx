"use client";

import FamilyActivityFeed from "../../../components/social/FamilyActivityFeed";

export default function MobileFeedPage() {
  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Family Feed</p>
        <h1>Family updates</h1>
        <p>Private activity from the family vaults you belong to.</p>
      </div>

      <FamilyActivityFeed />
    </section>
  );
}