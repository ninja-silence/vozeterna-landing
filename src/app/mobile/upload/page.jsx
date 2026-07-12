"use client";

import Link from "next/link";

export default function MobileUploadPage() {
  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Upload</p>
        <h1>Upload memories</h1>
        <p>Add photos, audio, video, keepsakes, and notes to your private family vault.</p>
        <Link href="/app/upload" className="mobilePrimaryButton">Open uploader</Link>
      </div>
    </section>
  );
}