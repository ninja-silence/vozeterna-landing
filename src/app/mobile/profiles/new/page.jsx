"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function MobileCreateProfilePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    relationship: "",
    bio: "",
    memorial_public: false,
  });

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.push("/mobile/account");
      return;
    }

    if (!form.full_name.trim()) {
      setSaving(false);
      setMessage("Please enter a name.");
      return;
    }

    const slugBase = form.full_name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { error } = await supabase.from("loved_ones").insert({
      user_id: user.id,
      full_name: form.full_name.trim(),
      relationship: form.relationship.trim() || null,
      bio: form.bio.trim() || null,
      memorial_public: form.memorial_public,
      memorial_slug: `${slugBase || "profile"}-${Date.now()}`,
      frame_style: "warm_wood",
    });

    setSaving(false);

    if (error) {
      setMessage(error.message || "Could not save profile.");
      return;
    }

    router.push("/mobile/profiles");
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Create Profile</p>
        <h1>New Loved One Profile</h1>
        <p>Create a private profile for a loved one, family member, or yourself.</p>
      </div>

      <form className="mobileFormCard" onSubmit={saveProfile}>
        <label>
          Full name
          <input
            value={form.full_name}
            onChange={(event) => updateField("full_name", event.target.value)}
            placeholder="Example: Maria Lopez"
          />
        </label>

        <label>
          Relationship
          <input
            value={form.relationship}
            onChange={(event) => updateField("relationship", event.target.value)}
            placeholder="Mother, father, brother, friend..."
          />
        </label>

        <label>
          Short bio
          <textarea
            value={form.bio}
            onChange={(event) => updateField("bio", event.target.value)}
            placeholder="Write a short note about this person."
          />
        </label>

        <label className="mobileCheckboxRow">
          <input
            type="checkbox"
            checked={form.memorial_public}
            onChange={(event) => updateField("memorial_public", event.target.checked)}
          />
          Enable public memorial page
        </label>

        {message && <p className="mobileFormMessage">{message}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create profile"}
        </button>
      </form>
    </section>
  );
}