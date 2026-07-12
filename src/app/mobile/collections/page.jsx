"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function MobileCollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollections() {
      const { data } = await supabase
        .from("memory_collections")
        .select("*, loved_ones(full_name), memory_collection_items(id)")
        .order("created_at", { ascending: false });

      setCollections(data || []);
      setLoading(false);
    }

    loadCollections();
  }, []);

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Collections</p>
        <h1>Memory Albums</h1>
        <p>Organize photos, voices, videos, and stories into curated family collections.</p>
        <Link href="/mobile/collections/new" className="mobilePrimaryButton">Create album</Link>
      </div>

      <div className="mobileCardList">
        {loading && <p className="mobileEmptyText">Loading albums...</p>}

        {!loading && collections.length === 0 && (
          <div className="mobileEmptyCard">
            <h2>No albums yet</h2>
            <p>Create your first album to organize family memories.</p>
          </div>
        )}

        {collections.map((collection) => (
          <Link href={`/mobile/collections/${collection.id}`} className="mobileListCard" key={collection.id}>
            <strong>{collection.title}</strong>
            <span>{collection.loved_ones?.full_name || "General family collection"}</span>
            <p>{collection.memory_collection_items?.length || 0} memories</p>
          </Link>
        ))}
      </div>
    </section>
  );
}