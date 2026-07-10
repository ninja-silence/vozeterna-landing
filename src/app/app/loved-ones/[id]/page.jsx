"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import MemoryActions from "../../../../components/app/MemoryActions";
import MemorialQrCode from "../../../../components/app/MemorialQrCode";

export default function LovedOneDetailPage() {
  const params = useParams();
  const lovedOneId = params.id;

  const [user, setUser] = useState(null);
  const [person, setPerson] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [memories, setMemories] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;

      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data: personData, error: personError } = await supabase
        .from("loved_ones")
        .select("*")
        .eq("id", lovedOneId)
        .single();

      if (personError) {
        setMessage(personError.message);
        setLoading(false);
        return;
      }

      setPerson(personData);

      if (personData.profile_photo_path) {
        const { data: signedPhotoData } = await supabase.storage
          .from("family-media")
          .createSignedUrl(personData.profile_photo_path, 60 * 10);

        if (signedPhotoData?.signedUrl) {
          setProfilePhotoUrl(signedPhotoData.signedUrl);
        }
      }

      const { data: memoryData, error: memoryError } = await supabase
        .from("media_assets")
        .select("*")
        .eq("loved_one_id", lovedOneId)
        .order("created_at", { ascending: false });

      if (memoryError) {
        setMessage(memoryError.message);
        setLoading(false);
        return;
      }

      setMemories(memoryData || []);

      const urlMap = {};

      for (const memory of memoryData || []) {
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

    loadProfile();
  }, [lovedOneId]);

  async function deleteMemory(memory) {
    const confirmed = window.confirm(`Delete "${memory.file_name}" from this legacy profile?`);

    if (!confirmed) return;

    const { error: storageError } = await supabase.storage
      .from("family-media")
      .remove([memory.file_path]);

    if (storageError) {
      setMessage(`Storage delete failed: ${storageError.message}`);
      return;
    }

    const { error: dbError } = await supabase
      .from("media_assets")
      .delete()
      .eq("id", memory.id);

    if (dbError) {
      setMessage(`Database delete failed: ${dbError.message}`);
      return;
    }

    setMemories((current) => current.filter((item) => item.id !== memory.id));
    setMessage("Memory deleted successfully.");
  }

  async function toggleMemoryPublic(memory) {
    const nextValue = !memory.show_on_memorial;

    const { error } = await supabase
      .from("media_assets")
      .update({ show_on_memorial: nextValue })
      .eq("id", memory.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMemories((current) =>
      current.map((item) =>
        item.id === memory.id ? { ...item, show_on_memorial: nextValue } : item
      )
    );

    setMessage(nextValue ? "Memory added to public memorial page." : "Memory hidden from public memorial page.");
  }

  function formatMemoryType(type) {
    const labels = {
      photo_of_person: "Photo of this person",
      photo_from_person: "Photo from this person",
      story_about_person: "Story about this person",
      message_from_person: "Message from this person",
      voice_of_person: "Voice of this person",
      family_memory: "Family memory",
      document_or_keepsake: "Document or keepsake",
    };

    return labels[type] || "";
  }

  function getFileKind(fileName, fileType) {
    const type = fileType || "";
    const lower = fileName.toLowerCase();

    if (type.startsWith("image/") || lower.match(/\.(jpg|jpeg|png|webp)$/)) return "image";
    if (type.startsWith("audio/") || lower.match(/\.(mp3|wav|webm|mpeg)$/)) return "audio";
    if (type.startsWith("video/") || lower.match(/\.(mp4|mov|webm|quicktime)$/)) return "video";

    return "file";
  }

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Legacy Profile</p>
          <h1>Loading profile...</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Legacy Profile</p>
          <h1>Please sign in</h1>
          <p>You need to sign in before viewing this private legacy profile.</p>

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

  if (!person) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Legacy Profile</p>
          <h1>Profile not found</h1>
          <p>This profile could not be found or you may not have permission to view it.</p>

          <Link href="/app/loved-ones" className="appButton">
            Back to profiles
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section className="profileHeroCard profileHeroWithPhoto">
        <div className="profileHeroPhoto">
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt={person.full_name} />
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

        <div>
          <p className="appEyebrow">Legacy Profile</p>
          <h1>{person.full_name}</h1>

          {person.relationship && <p className="profileRelationship">{person.relationship}</p>}

          {person.bio && <p className="profileBio">{person.bio}</p>}

          <div className="buttonRow">
            <Link href={`/app/upload?lovedOneId=${person.id}`} className="appButton">
              Upload memories
            </Link>

            <Link href={`/app/loved-ones/${person.id}/edit`} className="appButton secondary">
              Edit profile
            </Link>

            <Link href="/app/loved-ones" className="appButton secondary">
              Back to profiles
            </Link>
          </div>
        </div>
      </section>

      {person.memorial_public && person.memorial_slug && (
        <MemorialQrCode
          url={`${window.location.origin}/memorial/${person.memorial_slug}`}
        />
      )}

      <section className="libraryBox">
        <div className="sectionMiniHeader">
          <p className="appEyebrow">Saved Memories</p>
          <h2>{person.full_name}'s Legacy Vault</h2>
        </div>

        {message && <div className="successBox">{message}</div>}

        {memories.length === 0 ? (
          <div className="emptyState">
            <h2>No memories yet</h2>
            <p>Upload photos, voice recordings, videos, or stories for this profile.</p>

            <Link href={`/app/upload?lovedOneId=${person.id}`} className="appButton">
              Upload first memory
            </Link>
          </div>
        ) : (
          <div className="libraryGrid">
            {memories.map((memory) => {
              const kind = getFileKind(memory.file_name, memory.file_type);
              const url = signedUrls[memory.id];

              return (
                <article className="memoryCard" key={memory.id}>
                  <div className="memoryPreview">
                    {kind === "image" && url && <img src={url} alt={memory.file_name} />}
                    {kind === "audio" && url && <audio controls src={url} />}
                    {kind === "video" && url && <video controls src={url} />}
                    {kind === "file" && <span>File</span>}
                  </div>

                  <div className="memoryInfo">
                    <h2>{memory.file_name}</h2>
                    <p>{formatMemoryType(memory.memory_type) || kind.toUpperCase()}</p>

                    {memory.memory_note && (
                      <p className="memoryBio">{memory.memory_note}</p>
                    )}

                    <MemoryActions
                      url={url}
                      memoryName={memory.file_name}
                      isPublic={Boolean(memory.show_on_memorial)}
                      onTogglePublic={() => toggleMemoryPublic(memory)}
                      onDelete={() => deleteMemory(memory)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}