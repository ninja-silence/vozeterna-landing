"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function UploadPage() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }

    getUser();
  }, []);

  function handleFiles(event) {
    const selected = Array.from(event.target.files || []);
    setFiles(selected);
    setMessage("");
  }

  async function handleUpload() {
    if (!user) {
      setMessage("Please sign in before uploading memories.");
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
      const filePath = `${user.id}/${Date.now()}-${safeName}`;

      const { data, error } = await supabase.storage
        .from("family-media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        setMessage(`Upload failed for ${file.name}: ${error.message}`);
        setUploading(false);
        return;
      }

      successfulUploads.push({
        name: file.name,
        path: data.path,
        type: file.type,
        size: file.size,
      });
    }

    setUploadedFiles(successfulUploads);
    setUploading(false);
    setMessage("Upload complete. Your memories were saved to Supabase Storage.");
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

        <Link href="/app/profile" className="textLink">
          View profile
        </Link>
      </section>

      <section className="uploadBox">
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