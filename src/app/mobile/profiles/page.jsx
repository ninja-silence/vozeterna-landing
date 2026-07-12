"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function MobileProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfiles() {
      const { data } = await supabase
        .from("loved_ones")
        .select("*")
        .order("created_at", { ascending: false });

      setProfiles(data || []);
      setLoading(false);
    }

    loadProfiles();
  }, []);

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Profiles</p>
        <h1>Loved One Profiles</h1>
        <p>Create and manage the people connected to your private family vault.</p>
        <Link href="/app/loved-ones/new" className="mobilePrimaryButton">Create profile</Link>
      </div>

      <div className="mobileCardList">
        {loading && <p className="mobileEmptyText">Loading profiles...</p>}

        {!loading && profiles.length === 0 && (
          <div className="mobileEmptyCard">
            <h2>No profiles yet</h2>
            <p>Start by creating a profile for a loved one or yourself.</p>
          </div>
        )}

        {profiles.map((profile) => (
          <Link href={`/app/loved-ones/${profile.id}`} className="mobileListCard" key={profile.id}>
            <strong>{profile.full_name}</strong>
            <span>{profile.relationship || "Family profile"}</span>
            <p>{profile.memorial_public ? "Public page enabled" : "Private profile"}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}