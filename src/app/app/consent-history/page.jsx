"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function ConsentHistoryPage() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadConsentHistory() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("consent_records")
        .select("*")
        .order("accepted_at", { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        setRecords(data || []);
      }

      setLoading(false);
    }

    loadConsentHistory();
  }, []);

  function formatConsentType(type) {
    const labels = {
      voice_recording_ai_processing: "Voice Recording & AI Processing Consent",
    };

    return labels[type] || type || "Consent Record";
  }

  function formatDate(value) {
    if (!value) return "Unknown date";

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Consent History</p>
          <h1>Loading...</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Consent History</p>
          <h1>Please sign in</h1>
          <p>You need to sign in before viewing consent records.</p>

          <div className="buttonRow">
            <Link href="/app/login" className="appButton">
              Sign in
            </Link>

            <Link href="/app" className="appButton secondary">
              Back to app
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section className="appHero compact">
        <p className="appEyebrow">Consent History</p>
        <h1>Signed Consent Records</h1>
        <p>
          Review consent records connected to your VozEterna account, including the agreement version,
          timestamp, and captured signature.
        </p>

        <div className="buttonRow">
          <Link href="/app/consent" className="appButton">
            Sign new consent
          </Link>

          <Link href="/app/profile" className="appButton secondary">
            View profile
          </Link>
        </div>
      </section>

      <section className="libraryBox">
        {message && <div className="successBox">{message}</div>}

        {records.length === 0 ? (
          <div className="emptyState">
            <h2>No consent records yet</h2>
            <p>Complete the consent agreement before recording voice or video memories.</p>

            <Link href="/app/consent" className="appButton">
              Complete consent
            </Link>
          </div>
        ) : (
          <div className="consentHistoryList">
            {records.map((record, index) => (
              <article className="consentHistoryCard" key={record.id}>
                <div>
                  <p className="appEyebrow">
                    Consent Record {index === 0 ? "• Latest" : ""}
                  </p>
                  <h2>{record.full_name}</h2>

                  <div className="consentMeta">
                    <span>Type: {formatConsentType(record.consent_type)}</span>
                    <span>Version: {record.agreement_version}</span>
                    <span>Language: {record.language?.toUpperCase()}</span>
                    <span>Signed: {formatDate(record.accepted_at)}</span>
                  </div>
                </div>

                {record.signature_data_url ? (
                  <div className="signaturePreview">
                    <img src={record.signature_data_url} alt="Signature" />
                  </div>
                ) : (
                  <div className="signaturePreview emptySignature">
                    No signature saved
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}