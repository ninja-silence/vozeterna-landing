"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

function formatStorage(bytes) {
  const safeBytes = Number(bytes) || 0;
  if (safeBytes <= 0) return "0 KB";
  if (safeBytes < 1024 * 1024) return `${(safeBytes / 1024).toFixed(1)} KB`;
  return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MobileDashboardPage() {
  const [user, setUser] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    profiles: 0,
    memories: 0,
    publicPages: 0,
    albums: 0,
    consent: 0,
    storageBytes: 0,
  });

  const storageLimitBytes = 50 * 1024 * 1024;
  const storageBytes = Number(stats.storageBytes) || 0;
  const storagePercent = Math.min(100, Math.max(0, Math.round((storageBytes / storageLimitBytes) * 100)));
  const storageDisplay = loadingStats ? "—" : formatStorage(storageBytes);

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (!currentUser) {
        setLoadingStats(false);
        return;
      }

      const [
        profilesResult,
        memoriesResult,
        publicResult,
        albumsResult,
        consentResult,
        storageResult,
      ] = await Promise.all([
        supabase.from("loved_ones").select("id", { count: "exact", head: true }),
        supabase.from("media_assets").select("id", { count: "exact", head: true }),
        supabase.from("loved_ones").select("id", { count: "exact", head: true }).eq("memorial_public", true),
        supabase.from("memory_collections").select("id", { count: "exact", head: true }),
        supabase.from("consent_records").select("id", { count: "exact", head: true }),
        supabase.from("media_assets").select("file_size"),
      ]);

      const storageBytes = (storageResult.data || []).reduce((total, item) => {
        return total + (Number(item.file_size) || 0);
      }, 0);

      setStats({
        profiles: profilesResult.count || 0,
        memories: memoriesResult.count || 0,
        publicPages: publicResult.count || 0,
        albums: albumsResult.count || 0,
        consent: consentResult.count || 0,
        storageBytes,
      });

      setLoadingStats(false);
    }

    loadStats();
  }, []);

  const statCards = [
    { label: "Profiles", value: stats.profiles, title: "Loved Ones", text: "Manage profiles for family and close friends." },
    { label: "Memories", value: stats.memories, title: "Saved Items", text: "Photos, audio, video, notes, and keepsakes saved." },
    { label: "Albums", value: stats.albums, title: "Albums", text: "Curated memory collections." },
    { label: "Consent", value: stats.consent, title: "Consent", text: "Signed consent records." },
  ];

  const checklist = [
    { label: "Consent signed", done: stats.consent > 0 },
    { label: "Loved One profiles", done: stats.profiles > 0 },
    { label: "Add first memory", done: stats.memories > 0 },
    { label: "Enable public page", done: stats.publicPages > 0 },
    { label: "Review recordings", done: false },
    { label: "Approve for public page", done: false },
  ];

  return (
    <>
      <section className="mobileDashboardHeroGrid">
        <div className="mobileHeroMainCard">
          <Link href="/" className="mobileBackLink">
            Back to VozEterna App <strong>MVP</strong>
          </Link>

          <p className="mobileCapsLabel">Family Legacy</p>
          <h1>Family Legacy Vault</h1>
          <p className="mobileHeroText">
            Preserve voice memories, video messages, photos, prayers, stories, and family-approved memorial moments in one private legacy vault.
          </p>

          <div className="mobileHeroActions">
            <Link href={user ? "/mobile/profiles/new" : "/mobile/account"}>Create profile</Link>
            <Link href={user ? "/mobile/record" : "/mobile/account"}>Record memory</Link>
          </div>

          <div className="mobileStatGrid">
            {statCards.map((card) => (
              <article key={card.label}>
                <p>{card.label}</p>
                <strong>{loadingStats ? "—" : card.value}</strong>
                <h2>{card.title}</h2>
                <span>{card.text}</span>
              </article>
            ))}
          </div>
        </div>

        <aside className="mobileHeroStatusCard">
          <div className="mobileLangPill">
            <span className="active">EN</span>
            <span>ES</span>
          </div>

          <div className="mobileProtectedCard">
            <span>🛡</span>
            <div>
              <strong>Protected Vault</strong>
              <p>Private by default</p>
            </div>
          </div>

          <div className="mobileStorageCard">
            <div className="mobileStorageRing" style={{ "--mobile-storage": `${storagePercent}%` }}>
              <span>{storagePercent}%</span>
            </div>

            <div>
              <p>Storage used</p>
              <strong>{storageDisplay}</strong>
              <small>of 50 MB</small>
            </div>
          </div>

          <p className="mobileCapsLabel">Vault Progress</p>
          <h2>Vault Progress</h2>

          <div className="mobileProgressChecklist">
            {checklist.map((item) => (
              <div key={item.label} className={item.done ? "done" : ""}>
                <span>{item.done ? "✓" : "○"}</span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mobileFeatureGrid">
        <Link href="/mobile/consent">
          <p>Start Here</p>
          <h2>Consent & Agreements</h2>
          <span>Manage family consents and permissions.</span>
        </Link>

        <Link href="/mobile/profiles">
          <p>Profiles</p>
          <h2>Loved One Profiles</h2>
          <span>Care pages for the people who matter.</span>
        </Link>
      </section>
    </>
  );
}