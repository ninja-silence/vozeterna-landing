"use client";

import Link from "next/link";

export default function MobileRecordPage() {
  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Record Memories</p>
        <h1>Record voice and video</h1>
        <p>Capture blessings, stories, prayers, messages, and quiet family moments in your private legacy vault.</p>
      </div>

      <div className="mobileActionGrid">
        <Link href="/app/record" className="mobileActionCard primary">
          <span>◉</span>
          <strong>Open recorder</strong>
          <p>Use the existing recorder while we finish the mobile-native recorder screen.</p>
        </Link>

        <Link href="/mobile/upload" className="mobileActionCard">
          <span>▣</span>
          <strong>Upload a memory</strong>
          <p>Add photos, audio, video, keepsakes, and notes.</p>
        </Link>
      </div>

      <div className="mobilePromptCard">
        <p className="mobileCapsLabel">Ideas</p>
        <h2>Record something meaningful</h2>
        <ul>
          <li>Share a favorite story.</li>
          <li>Leave a blessing.</li>
          <li>Say what made someone special.</li>
          <li>Describe a favorite family moment.</li>
        </ul>
      </div>
    </section>
  );
}