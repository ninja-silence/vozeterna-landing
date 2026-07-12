"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, QrCode, UserRound } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

export default function MobileProfilesPage() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVaults();
  }, []);

  async function loadVaults() {
    setLoading(true);

    const { data, error } = await supabase
      .from("vaults")
      .select("id, title, subject_name, relationship_label, description, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Mobile profiles error:", error.message);
      setVaults([]);
      setLoading(false);
      return;
    }

    setVaults(data || []);
    setLoading(false);
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Profiles</p>
        <h1>Family vaults</h1>
        <p>Manage the loved one vaults and private family archives connected to your account.</p>
      </div>

      <section className="mobileActionGrid">
        <Link href="/mobile/profiles/new" className="mobileActionCard primary">
          <Plus size={20} />
          <strong>Create profile</strong>
          <p>Add a new loved one or family vault.</p>
        </Link>

        <Link href="/mobile/connect" className="mobileActionCard">
          <QrCode size={20} />
          <strong>Connect family</strong>
          <p>Create a private invite link or QR code.</p>
        </Link>
      </section>

      <section className="mobileCardList">
        {loading && <p className="mobileEmptyText">Loading profiles...</p>}

        {!loading && vaults.length === 0 && (
          <div className="mobileEmptyCard">
            <UserRound size={24} />
            <h2>No family vaults yet</h2>
            <p>Create your first profile or upload a memory to automatically start your family vault.</p>
            <Link href="/mobile/upload" className="mobileRecorderPrimary">Upload first memory</Link>
          </div>
        )}

        {vaults.map((vault) => (
          <article className="mobileListCard" key={vault.id}>
            <strong>{vault.subject_name || vault.title}</strong>
            <span>{vault.relationship_label || "Family vault"}</span>
            <p>{vault.description || "Private family archive."}</p>
          </article>
        ))}
      </section>
    </section>
  );
}