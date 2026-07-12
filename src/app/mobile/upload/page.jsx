"use client";

import Link from "next/link";
import { UploadCloud } from "lucide-react";

export default function MobileUploadPage() {
  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Upload</p>
        <h1>Upload memories</h1>
        <p>Add photos, audio, video, keepsakes, and notes to your private family vault.</p>
      </div>

      <Link href="/app/upload" className="mobileActionCard primary">
        <UploadCloud size={20} />
        <strong>Open full uploader</strong>
        <p>The full uploader is still being converted to mobile.</p>
      </Link>
    </section>
  );
}