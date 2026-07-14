"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { supabase } from "../../../../../lib/supabaseClient";

export default function MobileMemoryAddToAlbumPage() {
  const params = useParams();
  const router = useRouter();
  const memoryId = params?.id;

  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAlbums();
  }, [memoryId]);

  async function loadAlbums() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setMessage("Please log in before saving to an album.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("memory_collections")
      .select("id, title, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setAlbums([]);
      setLoading(false);
      return;
    }

    const rows = data || [];
    setAlbums(rows);
    setSelectedAlbumId(rows[0]?.id || "");
    setLoading(false);
  }

  async function saveToAlbum(event) {
    event.preventDefault();

    if (!memoryId || !selectedAlbumId || saving) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("memory_collection_items").insert({
      collection_id: selectedAlbumId,
      memory_id: memoryId,
      sort_order: 0,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message || "Could not save this memory to your album.");
      return;
    }

    router.push(`/mobile/collections/${selectedAlbumId}`);
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Albums</p>
        <h1>Save to album</h1>
        <p>Add this memory to one of your own albums. The original memory stays with its uploader.</p>

        <Link href={memoryId ? `/mobile/memories/${memoryId}` : "/mobile/library"} className="mobilePrimaryButton">
          Back to memory
        </Link>
      </div>

      <form className="mobileFormCard" onSubmit={saveToAlbum}>
        {loading ? (
          <p className="mobileFormHelper">Loading albums...</p>
        ) : albums.length === 0 ? (
          <>
            <p className="mobileFormHelper">Create an album first, then come back to save this memory.</p>
            <Link href="/mobile/collections/new" className="mobileRecorderPrimary">
              Create album
            </Link>
          </>
        ) : (
          <>
            <label>
              Choose album
              <select value={selectedAlbumId} onChange={(event) => setSelectedAlbumId(event.target.value)}>
                {albums.map((album) => (
                  <option value={album.id} key={album.id}>
                    {album.title}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" disabled={saving || !selectedAlbumId}>
              <FolderPlus size={17} />
              {saving ? "Saving..." : "Save to album"}
            </button>
          </>
        )}

        {message && <p className="mobileFormMessage">{message}</p>}
      </form>
    </section>
  );
}
