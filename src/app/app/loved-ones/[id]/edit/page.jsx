"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";

export default function EditLovedOnePage() {
  const params = useParams();
  const lovedOneId = params.id;

  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhotoPath, setProfilePhotoPath] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [memorialPublic, setMemorialPublic] = useState(false);
  const [memorialSlug, setMemorialSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      const { data, error } = await supabase
        .from("loved_ones")
        .select("*")
        .eq("id", lovedOneId)
        .single();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setFullName(data.full_name || "");
      setRelationship(data.relationship || "");
      setBirthDate(data.birth_date || "");
      setDeathDate(data.death_date || "");
      setBio(data.bio || "");
      setProfilePhotoPath(data.profile_photo_path || "");
      setMemorialPublic(Boolean(data.memorial_public));
      setMemorialSlug(data.memorial_slug || makeSlug(data.full_name || ""));

      if (data.profile_photo_path) {
        const { data: signedData } = await supabase.storage
          .from("family-media")
          .createSignedUrl(data.profile_photo_path, 60 * 10);

        if (signedData?.signedUrl) {
          setProfilePhotoUrl(signedData.signedUrl);
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, [lovedOneId]);

  function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    setProfilePhotoFile(file);
    setProfilePhotoUrl(URL.createObjectURL(file));
    setMessage("");
  }

  async function uploadProfilePhoto() {
    if (!profilePhotoFile || !user) {
      return profilePhotoPath || null;
    }

    const safeName = profilePhotoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const filePath = `${user.id}/${lovedOneId}/profile-photo-${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from("family-media")
      .upload(filePath, profilePhotoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return data.path;
  }

  function makeSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("Please sign in before editing this profile.");
      return;
    }

    if (!fullName.trim()) {
      setMessage("Please enter the person's full name.");
      return;
    }

    setSaving(true);

    try {
      const finalProfilePhotoPath = await uploadProfilePhoto();

      const { error } = await supabase
        .from("loved_ones")
        .update({
          full_name: fullName.trim(),
          relationship: relationship.trim() || null,
          birth_date: birthDate || null,
          death_date: deathDate || null,
          bio: bio.trim() || null,
          profile_photo_path: finalProfilePhotoPath,
          memorial_public: memorialPublic,
          memorial_slug: memorialSlug.trim() ? makeSlug(memorialSlug) : makeSlug(fullName),
          updated_at: new Date().toISOString(),
        })
        .eq("id", lovedOneId);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      window.location.href = `/app/loved-ones/${lovedOneId}`;
    } catch (error) {
      setMessage(error.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Edit Profile</p>
          <h1>Loading...</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Edit Profile</p>
          <h1>Please sign in</h1>
          <p>You need to sign in before editing this loved one profile.</p>

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
        <p className="appEyebrow">Edit Profile</p>
        <h1>Edit Loved One Profile</h1>
        <p>
          Update the profile photo, name, relationship, life dates, and legacy notes connected to this profile.
        </p>
      </section>

      <form className="consentBox" onSubmit={handleSubmit}>
        <label className="fieldLabel" htmlFor="profilePhoto">
          Profile photo
        </label>

        <div className="profilePhotoEditor">
          <div className="profilePhotoPreview">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profile preview" />
            ) : (
              <span>No photo yet</span>
            )}
          </div>

          <label className="profilePhotoUpload">
            <input
              id="profilePhoto"
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoChange}
            />
            Choose profile photo
          </label>
        </div>

        <div className="memorialSettingsBox">
          <label className="checkRow">
            <input
              type="checkbox"
              checked={memorialPublic}
              onChange={(e) => setMemorialPublic(e.target.checked)}
            />
            <span>Enable public memorial page</span>
          </label>

          <label className="fieldLabel" htmlFor="memorialSlug">
            Memorial page URL
          </label>

          <div className="slugPreviewRow">
            <span>/memorial/</span>
            <input
              id="memorialSlug"
              className="appInput"
              value={memorialSlug}
              onChange={(e) => setMemorialSlug(e.target.value)}
              placeholder="rosa-frias-lopez"
            />
          </div>

          <p className="helperText">
            This public page will show the profile photo, name, relationship, and bio. Private vault memories remain private.
          </p>
        </div>

        <label className="fieldLabel" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          className="appInput"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Example: Rosa Frias Lopez"
        />

        <label className="fieldLabel" htmlFor="relationship">
          Relationship
        </label>
        <input
          id="relationship"
          className="appInput"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="Example: Mother, Grandmother, Father, Friend"
        />

        <label className="fieldLabel" htmlFor="birthDate">
          Birth date optional
        </label>
        <input
          id="birthDate"
          className="appInput"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />

        <label className="fieldLabel" htmlFor="deathDate">
          Passing date optional
        </label>
        <input
          id="deathDate"
          className="appInput"
          type="date"
          value={deathDate}
          onChange={(e) => setDeathDate(e.target.value)}
        />

        <label className="fieldLabel" htmlFor="bio">
          Short story or notes
        </label>
        <textarea
          id="bio"
          className="appTextarea"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Write a short description, memory, faith note, family role, or legacy summary."
        />

        <div className="buttonRow">
          <button className="appButton" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>

          <Link href={`/app/loved-ones/${lovedOneId}`} className="appButton secondary">
            Cancel
          </Link>
        </div>

        {message && <div className="successBox">{message}</div>}
      </form>
    </main>
  );
}