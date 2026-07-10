"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function MemorialPage() {
  const params = useParams();
  const slug = params.slug;

  const [person, setPerson] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [memories, setMemories] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMemorial() {
      const { data, error } = await supabase
        .from("loved_ones")
        .select("id, full_name, relationship, bio, profile_photo_path, memorial_slug, memorial_public")
        .eq("memorial_slug", slug)
        .eq("memorial_public", true)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setPerson(data);

      if (data.profile_photo_path) {
        const { data: signedPhotoData } = await supabase.storage
          .from("family-media")
          .createSignedUrl(data.profile_photo_path, 60 * 10);

        if (signedPhotoData?.signedUrl) {
          setPhotoUrl(signedPhotoData.signedUrl);
        }
      }

      const { data: memoryData } = await supabase
        .from("media_assets")
        .select("id, file_name, file_path, file_type, memory_type, memory_note, created_at")
        .eq("loved_one_id", data.id)
        .eq("show_on_memorial", true)
        .order("created_at", { ascending: false });

      const publicMemories = memoryData || [];
      setMemories(publicMemories);

      const urlMap = {};

      for (const memory of publicMemories) {
        const { data: signedData } = await supabase.storage
          .from("family-media")
          .createSignedUrl(memory.file_path, 60 * 10);

        if (signedData?.signedUrl) {
          urlMap[memory.id] = signedData.signedUrl;
        }
      }

      setSignedUrls(urlMap);
      setLoading(false);
    }

    loadMemorial();
  }, [slug]);

  function getFileKind(fileName, fileType) {
    const type = fileType || "";
    const lower = fileName.toLowerCase();

    if (type.startsWith("image/") || lower.match(/\.(jpg|jpeg|png|webp)$/)) return "image";
    if (type.startsWith("audio/") || lower.match(/\.(mp3|wav|webm|mpeg)$/)) return "audio";
    if (type.startsWith("video/") || lower.match(/\.(mp4|mov|webm|quicktime)$/)) return "video";

    return "file";
  }

  function formatMemoryType(type) {
    const labels = {
      photo_of_person: "Photo",
      photo_from_person: "Photo from them",
      story_about_person: "Story",
      message_from_person: "Message",
      voice_of_person: "Voice memory",
      family_memory: "Family memory",
      document_or_keepsake: "Keepsake",
    };

    return labels[type] || "Memory";
  }

  if (loading) {
    return (
      <main className="memorialShell">
        <section className="memorialCard">
          <p className="appEyebrow">VozEterna Memorial</p>
          <h1>Loading memorial...</h1>
        </section>
      </main>
    );
  }

  if (!person) {
    return (
      <main className="memorialShell">
        <section className="memorialCard">
          <p className="appEyebrow">VozEterna Memorial</p>
          <h1>Memorial not found</h1>
          <p>This memorial page may be private, unavailable, or not yet published.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="memorialShell">
      <section className="memorialCard">
        <p className="appEyebrow">VozEterna Memorial</p>

        <div className="memorialPhoto">
          {photoUrl ? (
            <img src={photoUrl} alt={person.full_name} />
          ) : (
            <span>
              {person.full_name
                ?.split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase() || "VE"}
            </span>
          )}
        </div>

        <h1>{person.full_name}</h1>

        {person.relationship && <p className="memorialRelationship">{person.relationship}</p>}

        {person.bio && <p className="memorialBio">{person.bio}</p>}

        <div className="memorialFooter">
          <span>Preserved with VozEterna</span>
          <span>Shared memories were approved by the family.</span>
        </div>
      </section>

      {memories.length > 0 && (
        <section className="publicMemoriesSection">
          <p className="appEyebrow">Shared Memories</p>
          <h2>Memories shared by the family</h2>

          <div className="publicMemoryGrid">
            {memories.map((memory) => {
              const kind = getFileKind(memory.file_name, memory.file_type);
              const url = signedUrls[memory.id];

              return (
                <article className="publicMemoryCard" key={memory.id}>
                  <div className="publicMemoryPreview">
                    {kind === "image" && url && <img src={url} alt={memory.file_name} />}
                    {kind === "audio" && url && <audio controls src={url} />}
                    {kind === "video" && url && <video controls src={url} />}
                    {kind === "file" && <span>Memory</span>}
                  </div>

                  <div className="publicMemoryInfo">
                    <p>{formatMemoryType(memory.memory_type)}</p>
                    <h3>{memory.memory_note || memory.file_name}</h3>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}