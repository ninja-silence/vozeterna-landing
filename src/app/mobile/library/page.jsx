"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function MobileLibraryPage() {
  const [memories, setMemories] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMemories() {
      const { data } = await supabase
        .from("media_assets")
        .select("*, loved_ones(full_name)")
        .order("created_at", { ascending: false });

      const rows = data || [];
      const urls = {};

      await Promise.all(
        rows.map(async (memory) => {
          if (!memory.file_path) return;

          const { data: signed } = await supabase.storage
            .from("family-media")
            .createSignedUrl(memory.file_path, 3600);

          if (signed?.signedUrl) {
            urls[memory.id] = signed.signedUrl;
          }
        })
      );

      setSignedUrls(urls);
      setMemories(rows);
      setLoading(false);
    }

    loadMemories();
  }, []);

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Library</p>
        <h1>Memory Library</h1>
        <p>Review photos, audio, video, notes, and keepsakes saved in your vault.</p>
        <Link href="/mobile/record" className="mobilePrimaryButton">Add memory</Link>
      </div>

      <div className="mobileMemoryGrid">
        {loading && <p className="mobileEmptyText">Loading memories...</p>}

        {!loading && memories.length === 0 && (
          <div className="mobileEmptyCard">
            <h2>No memories yet</h2>
            <p>Record a voice message or upload a photo to begin.</p>
          </div>
        )}

        {memories.map((memory) => (
          <article className="mobileMemoryCard" key={memory.id}>
            {memory.file_type?.startsWith("image/") && signedUrls[memory.id] && (
              <img src={signedUrls[memory.id]} alt={memory.title || memory.file_name} />
            )}

            {memory.file_type?.startsWith("audio/") && signedUrls[memory.id] && (
              <audio src={signedUrls[memory.id]} controls />
            )}

            {memory.file_type?.startsWith("video/") && signedUrls[memory.id] && (
              <video src={signedUrls[memory.id]} controls />
            )}

            <div>
              <span>{memory.visibility || "private"}</span>
              <strong>{memory.title || memory.file_name}</strong>
              <p>{memory.loved_ones?.full_name || "General memory"}</p>
              <Link href={`/app/memories/${memory.id}`}>Open memory</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}