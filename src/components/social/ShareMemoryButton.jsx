"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export default function ShareMemoryButton({
  title = "VozEterna memory",
  text = "A private family memory was shared with you through VozEterna.",
  url,
  className = "",
  labels = {
    share: "Share",
    shared: "Shared",
    copied: "Copied",
    copyManually: "Copy manually",
  },
}) {
  const [status, setStatus] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && Boolean(navigator.share));
  }, []);

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

  const buttonText =
    status === "shared"
      ? labels.shared
      : status === "copied"
        ? labels.copied
        : status === "copy manually"
          ? labels.copyManually
          : labels.share;

  return (
    <button
      type="button"
      className={`nativeShareButton ${className}`}
      onClick={handleShare}
      aria-label={labels.share}
    >
      {status === "shared" || status === "copied" ? (
        <Check size={15} strokeWidth={2.4} />
      ) : canNativeShare ? (
        <Share2 size={15} strokeWidth={2.4} />
      ) : (
        <Copy size={15} strokeWidth={2.4} />
      )}

      <span>{buttonText}</span>
    </button>
  );
}