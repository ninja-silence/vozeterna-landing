"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Edit3,
  Eye,
  MessageCircle,
  MoreVertical,
  Share2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { normalizeStoragePath } from "../../lib/storagePaths";

const defaultLabels = {
  view: "View",
  edit: "Edit",
  security: "Security",
  delete: "Delete",
  share: "Share",
  copied: "Copied",
  comments: "Comments",
  confirmDelete: "Delete this memory? This cannot be undone.",
  deleteFailed: "Could not delete memory.",
};

export default function MobileMemoryActions({
  memory,
  activityId,
  commentsHref,
  onDeleted,
  labels = defaultLabels,
}) {
  const router = useRouter();
  const menuRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  const t = { ...defaultLabels, ...labels };

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!memory?.id) {
    return null;
  }

  const memoryHref = `/mobile/memories/${memory.id}`;
  const editHref = `/mobile/memories/${memory.id}/edit`;
  const securityHref = memory.vault_id
    ? `/mobile/security?vaultId=${memory.vault_id}&memoryId=${memory.id}`
    : `/mobile/security?memoryId=${memory.id}`;

  const resolvedCommentsHref =
    commentsHref || (activityId ? `/mobile/comments/${activityId}` : "");

  function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function toggleMenu(event) {
    stopEvent(event);
    setOpen((current) => !current);
  }

  function goTo(event, path) {
    stopEvent(event);
    setOpen(false);
    router.push(path);
  }

  async function shareMemory(event) {
    stopEvent(event);

    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${memoryHref}`
        : "https://vozeterna-landing.vercel.app/mobile";

    try {
      if (navigator.share) {
        await navigator.share({
          title: memory.title || "VozEterna memory",
          text: memory.body || "A private VozEterna memory.",
          url,
        });

        setOpen(false);
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareStatus("copied");

      window.setTimeout(() => {
        setShareStatus("");
      }, 1600);
    } catch {
      setShareStatus("");
    }
  }

  async function deleteMemory(event) {
    stopEvent(event);

    const confirmed = window.confirm(t.confirmDelete);

    if (!confirmed) {
      return;
    }

    try {
      const mediaPath = normalizeStoragePath(memory.media_path);
      if (mediaPath) {
        await supabase.storage.from("family-media").remove([mediaPath]);
      }

      const narrationPath = normalizeStoragePath(memory.narration_audio_path);
      if (narrationPath) {
        await supabase.storage.from("family-media").remove([narrationPath]);
      }

      const { error } = await supabase.from("memories").delete().eq("id", memory.id);

      if (error) {
        throw new Error(error.message);
      }

      setOpen(false);

      if (typeof onDeleted === "function") {
        onDeleted(memory.id);
      }
    } catch (error) {
      alert(error.message || t.deleteFailed);
    }
  }

  return (
    <div
      className="mobileMemoryActionWrap"
      ref={menuRef}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={`mobileMemoryDots ${open ? "isOpen" : ""}`}
        aria-label="Memory actions"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <MoreVertical size={19} />
      </button>

      {open && (
        <div className="mobileMemoryMenu" role="menu">
          <button type="button" role="menuitem" onClick={(event) => goTo(event, memoryHref)}>
            <Eye size={16} />
            <span>{t.view}</span>
          </button>

          <button type="button" role="menuitem" onClick={(event) => goTo(event, editHref)}>
            <Edit3 size={16} />
            <span>{t.edit}</span>
          </button>

          <button type="button" role="menuitem" onClick={(event) => goTo(event, securityHref)}>
            <ShieldCheck size={16} />
            <span>{t.security}</span>
          </button>

          {resolvedCommentsHref && (
            <button
              type="button"
              role="menuitem"
              onClick={(event) => goTo(event, resolvedCommentsHref)}
            >
              <MessageCircle size={16} />
              <span>{t.comments}</span>
            </button>
          )}

          <button type="button" role="menuitem" onClick={shareMemory}>
            {shareStatus === "copied" ? <Check size={16} /> : <Share2 size={16} />}
            <span>{shareStatus === "copied" ? t.copied : t.share}</span>
          </button>

          <button type="button" role="menuitem" className="danger" onClick={deleteMemory}>
            <Trash2 size={16} />
            <span>{t.delete}</span>
          </button>
        </div>
      )}
    </div>
  );
}
