"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function UploadPage() {
  const [user, setUser] = useState(null);
  const [lovedOnes, setLovedOnes] = useState([]);
  const [selectedLovedOneId, setSelectedLovedOneId] = useState("");
  const [files, setFiles] = useState([]);
  const [memoryType, setMemoryType] = useState("photo_of_person");
  const [memoryNote, setMemoryNote] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUserAndProfiles() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) return;

      const { data, error } = await supabase
        .from("loved_ones")
        .select("id, full_name, relationship")
        .order("created_at", { ascending: false });

      if (!error) {
        const profiles = data || [];
        setLovedOnes(profiles);

        if (profiles.length) {
          const params = new URLSearchParams(window.location.search);
          const requestedLovedOneId = params.get("lovedOneId");
          const profileExists = profiles.some((profile) => profile.id === requestedLovedOneId);

          setSelectedLovedOneId(profileExists ? requestedLovedOneId : profiles[0].id);
        }
      }
    }

    loadUserAndProfiles();
  }, []);

  function handleFiles(event) {
    const selected = Array.from(event.target.files || []);
    setFiles(selected);
    setMessage("");
    setUploadedFiles([]);
  }

  async function handleUpload() {
    if (!user) {
      setMessage("Please sign in before uploading memories.");
      return;
    }

    if (!selectedLovedOneId) {
      setMessage("Please create or select a loved one profile before uploading.");
      return;
    }

    if (files.length === 0) {
      setMessage("Please choose at least one file.");
      return;
    }

    setUploading(true);
    setMessage("");

    const successfulUploads = [];

    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const filePath = `${user.id}/${selectedLovedOneId}/${Date.now()}-${safeName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from("family-media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (storageError) {
        setMessage(`Upload failed for ${file.name}: ${storageError.message}`);
        setUploading(false);
        return;
      }

      const { error: dbError } = await supabase.from("media_assets").insert({
        user_id: user.id,
        loved_one_id: selectedLovedOneId,
        file_name: file.name,
        file_path: storageData.path,
        file_type: file.type || null,
        file_size: file.size,
        title: file.name,
        memory_type: memoryType,
        memory_note: memoryNote.trim() || null,
        visibility: "private",
      });

      if (dbError) {
        setMessage(`File uploaded, but database record failed: ${dbError.message}`);
        setUploading(false);
        return;
      }

      successfulUploads.push({
        name: file.name,
        path: storageData.path,
        type: file.type,
        size: file.size,
      });
    }

    setUploadedFiles(successfulUploads);
    setUploading(false);
    setFiles([]);
    setMessage("Upload complete. Your memories were saved to this loved one profile.");
  }

  if (!user) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">Step 3</p>
          <h1>Upload Memories</h1>
          <p>You need to sign in before uploading private family memories.</p>

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
        <p className="appEyebrow">Step 3</p>
        <h1>Upload Memories</h1>
        <p>
          Upload photos, audio files, and videos. Files are saved privately to your VozEterna cloud vault.
        </p>

        <div className="buttonRow">
          <Link href="/app/library" className="appButton">
            View library
          </Link>

          <Link href="/app/loved-ones" className="appButton secondary">
            Loved one profiles
          </Link>
        </div>
      </section>

      <section className="uploadBox">
        {lovedOnes.length === 0 ? (
          <div className="emptyState">
            <h2>Create a loved one profile first</h2>
            <p>
              Before uploading memories, create a profile for the person these memories belong to.
            </p>

            <Link href="/app/loved-ones/new" className="appButton">
              Create profile
            </Link>
          </div>
        ) : (
          <>
            <label className="fieldLabel" htmlFor="lovedOne">
              Who is this memory for?
            </label>

            <select
              id="lovedOne"
              className="appInput"
              value={selectedLovedOneId}
              onChange={(e) => setSelectedLovedOneId(e.target.value)}
            >
              {lovedOnes.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                  {person.relationship ? ` — ${person.relationship}` : ""}
                </option>
              ))}
            </select>

            <label className="fieldLabel" htmlFor="memoryType">
              What kind of memory is this?
            </label>

            <select
              id="memoryType"
              className="appInput"
              value={memoryType}
              onChange={(e) => setMemoryType(e.target.value)}
            >
              <option value="photo_of_person">Photo of this person</option>
              <option value="photo_from_person">Photo from this person</option>
              <option value="story_about_person">Story about this person</option>
              <option value="message_from_person">Message from this person</option>
              <option value="voice_of_person">Voice of this person</option>
              <option value="family_memory">Family memory connected to this person</option>
              <option value="document_or_keepsake">Document or keepsake</option>
            </select>

            <label className="fieldLabel" htmlFor="memoryNote">
              Optional memory note
            </label>

            <textarea
              id="memoryNote"
              className="appTextarea"
              value={memoryNote}
              onChange={(e) => setMemoryNote(e.target.value)}
              placeholder="Example: Mom at my graduation, Grandma's prayer, Dad's advice, family recipe, or a special memory."
            />

            <label className="uploadDrop">
              <input
                type="file"
                multiple
                accept="image/*,audio/*,video/*"
                onChange={handleFiles}
              />
              <span>Choose photos, audio, or video files</span>
            </label>

            {files.length > 0 && (
              <div className="fileList">
                <h2>Selected files</h2>

                {files.map((file) => (
                  <div className="fileItem" key={file.name}>
                    <strong>{file.name}</strong>
                    <span>{file.type || "Unknown type"}</span>
                    <span>{Math.round(file.size / 1024)} KB</span>
                  </div>
                ))}

                <button className="appButton uploadButton" onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Memories"}
                </button>
              </div>
            )}
          </>
        )}

        {message && <div className="successBox">{message}</div>}

        {uploadedFiles.length > 0 && (
          <div className="fileList">
            <h2>Uploaded files</h2>

            {uploadedFiles.map((file) => (
              <div className="fileItem" key={file.path}>
                <strong>{file.name}</strong>
                <span>{file.type || "Unknown type"}</span>
                <span>Saved</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}