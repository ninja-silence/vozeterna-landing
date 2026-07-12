"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export default function ShareMemoryButton({
  title = "VozEterna memory",
  text = "A private family memory was shared with you through VozEterna.",
  url,
  className = "",
}) {
  const [status, setStatus] = useState("");

  async function handleShare(event) {
    event.preventDefault();
    event.stopPropagation();

    const shareUrl =
      url ||
      (typeof window !== "undefined"
        ? window.location.href
        : "https://vozeterna-landing.vercel.app");

    const shareData = {
      title,
      text,
      url: shareUrl,
    };

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        setStatus("shared");
        window.setTimeout(() => setStatus(""), 1800);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setStatus("copied");
        window.setTimeout(() => setStatus(""), 1800);
        return;
      }

      setStatus("copy manually");
    } catch (error) {
      if (error?.name === "AbortError") return;

      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          setStatus("copied");
          window.setTimeout(() => setStatus(""), 1800);
        }
      } catch {
        setStatus("copy manually");
      }
    }
  }

  return (
    <button
      type="button"
      className={`nativeShareButton ${className}`}
      onClick={handleShare}
      aria-label="Share memory"
    >
      {status === "shared" || status === "copied" ? (
        <Check size={15} strokeWidth={2.4} />
      ) : navigator?.share ? (
        <Share2 size={15} strokeWidth={2.4} />
      ) : (
        <Copy size={15} strokeWidth={2.4} />
      )}

      <span>
        {status === "shared"
          ? "Shared"
          : status === "copied"
            ? "Copied"
            : "Share"}
      </span>
    </button>
  );
}