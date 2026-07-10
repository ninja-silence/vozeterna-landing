"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function LovedOnesPage() {
  const [user, setUser] = useState(null);
  const [lovedOnes, setLovedOnes] = useState([]);
  const [profileImages, setProfileImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLovedOnes() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("loved_ones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const profiles = data || [];
      setLovedOnes(profiles);

      const imageMap = {};

      for (const profile of profiles) {
        if (profile.profile_photo_path) {
          const { data: signedData } = await supabase.storage
            .from("family-media")
            .createSignedUrl(profile.profile_photo_path, 60 * 10);

          if (signedData?.signedUrl) {
            imageMap[profile.id] = signedData.signedUrl;
            continue;
          }
        }

        const { data: mediaData } = await supabase
          .from("media_assets")
          .select("file_path, file_type, file_name")
          .eq("loved_one_id", profile.id)
          .order("created_at", { ascending: false });

        const firstImage = (mediaData || []).find((item) => {
          const type = item.file_type || "";
          const name = item.file_name || "";
          return type.startsWith("image/") || name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
        });

        if (firstImage?.file_path) {
          const { data: signedData } = await supabase.storage
            .from("family-media")
            .createSignedUrl(firstImage.file_path, 60 * 10);

          if (signedData?.signedUrl) {
            imageMap[profile.id] = signedData.signedUrl;
          }
        }
      }

      setProfileImages(imageMap);
      setLoading(false);
    }

    loadLovedOnes();
  }, []);

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Loved One Profiles</p>
          <h1>Loading...</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Loved One Profiles</p>
          <h1>Please sign in</h1>
          <p>You need to sign in before creating a family legacy profile.</p>

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
        <p className="appEyebrow">Loved One Profiles</p>
        <h1>Who are these memories for?</h1>
        <p>
          Create a profile for a parent, grandparent, spouse, relative, friend, or loved one whose voice,
          stories, photos, and memories you want to preserve.
        </p>

        <div className="buttonRow">
          <Link href="/app/loved-ones/new" className="appButton">
            Create profile
          </Link>

          <Link href="/app/library" className="appButton secondary">
            View library
          </Link>
        </div>
      </section>

      <section className="libraryBox">
        {message && <div className="successBox">{message}</div>}

        {lovedOnes.length === 0 ? (
          <div className="emptyState">
            <h2>No profiles yet</h2>
            <p>Create your first loved one profile to begin organizing memories with meaning.</p>

            <Link href="/app/loved-ones/new" className="appButton">
              Create first profile
            </Link>
          </div>
        ) : (
          <div className="profileCardGrid">
            {lovedOnes.map((person) => (
              <article className="legacyProfileCard" key={person.id}>
                <div className="legacyProfileImage">
                  {profileImages[person.id] ? (
                    <img src={profileImages[person.id]} alt={person.full_name} />
                  ) : (
                    <div className="legacyProfilePlaceholder">
                      {person.full_name
                        ?.split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase() || "VE"}
                    </div>
                  )}
                </div>

                <div className="legacyProfileContent">
                  <p className="appEyebrow">Legacy Profile</p>
                  <h2>{person.full_name}</h2>

                  {person.relationship && <p className="profileRelationshipSmall">{person.relationship}</p>}

                  {person.bio && <p className="memoryBio">{person.bio}</p>}

                  <div className="profileCardActions">
                    <Link href={`/app/loved-ones/${person.id}`} className="textLink">
                      Open legacy profile
                    </Link>

                    <Link href={`/app/upload?lovedOneId=${person.id}`} className="textLink">
                      Upload memory
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}