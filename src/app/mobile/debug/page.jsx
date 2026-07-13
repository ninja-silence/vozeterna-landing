"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, ShieldCheck } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

const checks = [
  {
    key: "vaults",
    label: "Profiles / Vaults",
    query: () =>
      supabase
        .from("vaults")
        .select("id, title, subject_name, network_id, public_enabled, public_slug, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
  },
  {
    key: "memories",
    label: "Memories",
    query: () =>
      supabase
        .from("memories")
        .select("id, title, type, vault_id, network_id, media_path, feed_visibility, show_on_public_page, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
  },
  {
    key: "network_activity",
    label: "Feed Activity",
    query: () =>
      supabase
        .from("network_activity")
        .select("id, title, activity_type, memory_id, vault_id, network_id, feed_visibility, is_commentable, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
  },
  {
    key: "vault_albums",
    label: "Albums",
    query: () =>
      supabase
        .from("vault_albums")
        .select("id, title, vault_id, network_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
  },
  {
    key: "network_comments",
    label: "Comments",
    query: () =>
      supabase
        .from("network_comments")
        .select("id, body, activity_id, memory_id, network_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
  },
  {
    key: "consent_records",
    label: "Consent Records",
    query: () =>
      supabase
        .from("consent_records")
        .select("id, full_name, agreement_version, language, accepted_at")
        .order("accepted_at", { ascending: false })
        .limit(5),
  },
];

export default function MobileDebugPage() {
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [envStatus, setEnvStatus] = useState({
    url: false,
    anon: false,
  });
  const [results, setResults] = useState([]);

  useEffect(() => {
    runChecks();
  }, []);

  async function runChecks() {
    setLoading(true);

    setEnvStatus({
      url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    setAuthUser({
      id: user?.id || "",
      email: user?.email || "",
      error: userError?.message || "",
    });

    const nextResults = [];

    for (const check of checks) {
      try {
        const { data, error } = await check.query();

        nextResults.push({
          key: check.key,
          label: check.label,
          ok: !error,
          error: error?.message || "",
          count: Array.isArray(data) ? data.length : 0,
          rows: data || [],
        });
      } catch (error) {
        nextResults.push({
          key: check.key,
          label: check.label,
          ok: false,
          error: error.message || "Unknown error",
          count: 0,
          rows: [],
        });
      }
    }

    setResults(nextResults);
    setLoading(false);
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Supabase Debug</p>
        <h1>Data connection check</h1>
        <p>This checks whether the deployed mobile app is reading Supabase correctly.</p>

        <button type="button" className="mobilePrimaryButton" onClick={runChecks}>
          <RefreshCcw size={17} />
          Refresh checks
        </button>
      </div>

      <section className="mobileFormCard">
        <p className="mobileCapsLabel">Environment</p>

        <div className={envStatus.url ? "mobileDebugRow ok" : "mobileDebugRow bad"}>
          <ShieldCheck size={17} />
          <strong>NEXT_PUBLIC_SUPABASE_URL</strong>
          <span>{envStatus.url ? "Found" : "Missing"}</span>
        </div>

        <div className={envStatus.anon ? "mobileDebugRow ok" : "mobileDebugRow bad"}>
          <ShieldCheck size={17} />
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong>
          <span>{envStatus.anon ? "Found" : "Missing"}</span>
        </div>
      </section>

      <section className="mobileFormCard">
        <p className="mobileCapsLabel">Auth User</p>

        <div className={authUser?.id ? "mobileDebugAuth ok" : "mobileDebugAuth bad"}>
          <strong>{authUser?.id ? "Signed in" : "Not signed in"}</strong>
          {authUser?.email && <span>{authUser.email}</span>}
          {authUser?.id && <small>{authUser.id}</small>}
          {authUser?.error && <p>{authUser.error}</p>}
        </div>
      </section>

      <section className="mobileCardList">
        {loading ? (
          <div className="mobileEmptyCard">
            <p>Checking Supabase...</p>
          </div>
        ) : (
          results.map((result) => (
            <article className={result.ok ? "mobileDebugCard ok" : "mobileDebugCard bad"} key={result.key}>
              <div>
                <strong>{result.label}</strong>
                <span>{result.ok ? `${result.count} rows returned` : "Error"}</span>
              </div>

              {result.error && <p>{result.error}</p>}

              {result.rows.length > 0 && (
                <pre>{JSON.stringify(result.rows, null, 2)}</pre>
              )}
            </article>
          ))
        )}
      </section>
    </section>
  );
}