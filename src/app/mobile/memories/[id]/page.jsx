"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  FileText,
  ImageOff,
  MessageCircle,
  ShieldCheck,
  Trash2,
  Volume2,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { normalizeStoragePath, warnInvalidStoragePath } from "../../../../lib/storagePaths";

function MediaFallback() {
  return (
    <div className="mobileMediaFallback">
      <ImageOff size={26} />
      <strong>Media unavailable</strong>
      <span>This file may be missing, private, or still processing.</span>
    </div>
  );
}

function getMemoryMediaKind(memory = {}) {
  const safeMemory = memory || {};
  const type = safeMemory.type || "";
  const mimeType = safeMemory.media_mime_type || "";
  const mediaPath = String(safeMemory.media_path || "").toLowerCase();

  if (type === "photo" || mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|avif)$/.test(mediaPath)) {
    return "photo";
  }

  if (type === "video" || mimeType.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/.test(mediaPath)) {
    return "video";
  }

  if (type === "audio" || mimeType.startsWith("audio/") || /\.(mp3|wav|webm|m4a|aac|ogg)$/.test(mediaPath)) {
    return "audio";
  }

  return "document";
}

export default function MobileMemoryViewPage() {
  const params = useParams();
  const router = useRouter();
  const memoryId = params?.id;

  const [memory, setMemory] = useState(null);
  const [activity, setActivity] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [narrationUrl, setNarrationUrl] = useState("");
  const [mediaFailed, setMediaFailed] = useState(false);
  const [narrationFailed, setNarrationFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (memoryId) {
      loadMemory(memoryId);
    }
  }, [memoryId]);

  async function loadMemory(id) {
    setLoading(true);
    setPageError("");
    setMediaUrl("");
    setNarrationUrl("");
    setMediaFailed(false);
    setNarrationFailed(false);

    try {
      const { data, error } = await supabase
        .from("memories")
        .select(
          "id, title, body, type, media_path, media_mime_type, feed_visibility, show_on_public_page, vault_id, network_id, narration_audio_path, created_at"
        )
        .eq("id", id)
        .maybeSingle();

      if (error) {
        setPageError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setMemory(null);
        setPageError("Memory not found.");
        setLoading(false);
        return;
      }

      setMemory(data);

      const mediaPath = normalizeStoragePath(data.media_path);
      if (mediaPath) {
        const { data: signed, error: signedError } = await supabase.storage
          .from("family-media")
          .createSignedUrl(mediaPath, 3600);

        if (!signedError && signed?.signedUrl) {
          setMediaUrl(signed.signedUrl);
        } else {
          warnInvalidStoragePath("mobile memory media", data.media_path);
        }
      } else if (data.media_path) {
        warnInvalidStoragePath("mobile memory media", data.media_path);
      }

      const narrationPath = normalizeStoragePath(data.narration_audio_path);
      if (narrationPath) {
        const { data: signedNarration, error: narrationError } = await supabase.storage
          .from("family-media")
          .createSignedUrl(narrationPath, 3600);

        if (!narrationError && signedNarration?.signedUrl) {
          setNarrationUrl(signedNarration.signedUrl);
        } else {
          warnInvalidStoragePath("mobile memory narration", data.narration_audio_path);
        }
      } else if (data.narration_audio_path) {
        warnInvalidStoragePath("mobile memory narration", data.narration_audio_path);
      }

      const { data: activityData } = await supabase
        .from("network_activity")
        .select("id, feed_visibility, is_commentable")
        .eq("memory_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setActivity(activityData || null);
      setLoading(false);
    } catch (error) {
      setPageError(error.message || "This memory could not load.");
      setLoading(false);
    }
  }

  async function deleteMemory() {
    if (!memory?.id) return;

    const confirmed = window.confirm("Delete this memory? This cannot be undone.");
    if (!confirmed) return;

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
        setPageError(error.message);
        return;
      }

      router.push("/mobile/library");
    } catch (error) {
      setPageError(error.message || "Could not delete memory.");
    }
  }

  if (loading) {
    return (
      <section className="mobileScreenStack">
        <div className="mobileScreenHero">
          <p className="mobileCapsLabel">Memory</p>
          <h1>Loading memory...</h1>
        </div>
      </section>
    );
  }

  if (!memory) {
    return (
      <section className="mobileScreenStack">
        <div className="mobileScreenHero">
          <p className="mobileCapsLabel">Memory</p>
          <h1>Memory not found</h1>
          {pageError && <p>{pageError}</p>}

          <Link href="/mobile/library" className="mobilePrimaryButton">
            <ArrowLeft size={17} />
            Back to library
          </Link>
        </div>
      </section>
    );
  }

  const mediaKind = getMemoryMediaKind(memory);

  return (
    <section className="mobileScreenStack mobileMemoryDetailScreen">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Memory</p>
        <h1>{memory.title || "Untitled memory"}</h1>

        <div className="mobileSecurityPills">
          <span>{memory.feed_visibility === "network" ? "Network feed" : "Private"}</span>
          {memory.show_on_public_page && <span>Public page</span>}
        </div>
      </div>

      <section className="mobileMemoryDetailCard">
        {mediaKind === "photo" && mediaUrl && !mediaFailed && (
          <img
            src={mediaUrl}
            alt={memory.title || "Memory"}
            className="mobileMemoryDetailMedia"
            onError={() => setMediaFailed(true)}
          />
        )}

        {mediaKind === "video" && mediaUrl && !mediaFailed && (
          <video
            src={mediaUrl}
            controls
            playsInline
            className="mobileMemoryDetailMedia"
            onError={() => setMediaFailed(true)}
          />
        )}

        {mediaKind === "audio" && mediaUrl && !mediaFailed && (
          <audio
            src={mediaUrl}
            controls
            className="mobileMemoryDetailAudio"
            onError={() => setMediaFailed(true)}
          />
        )}

        {(!mediaUrl || mediaFailed) && <MediaFallback />}

        <p>{memory.body || "No description yet."}</p>

        <div className="mobileNarrationBox">
          <p className="mobileCapsLabel">
            <Volume2 size={15} />
            AI voice narration
          </p>

          {narrationUrl && !narrationFailed ? (
            <audio
              src={narrationUrl}
              controls
              className="mobileMemoryDetailAudio"
              onError={() => setNarrationFailed(true)}
            />
          ) : (
            <p className="mobileFormHelper">No narration generated yet.</p>
          )}
        </div>

        <div className="familyFeedActions">
          <Link href={`/mobile/memories/${memory.id}/edit`} className="familyFeedCommentButton">
            <Edit3 size={16} />
            Edit
          </Link>

          <Link
            href={`/mobile/security?vaultId=${memory.vault_id || ""}&memoryId=${memory.id}`}
            className="familyFeedCommentButton"
          >
            <ShieldCheck size={16} />
            Security
          </Link>

          {activity?.id && (
            <Link href={`/mobile/comments/${activity.id}`} className="familyFeedCommentButton">
              <MessageCircle size={16} />
              Comments
            </Link>
          )}

          <button type="button" className="mobileDeleteButton" onClick={deleteMemory}>
            <Trash2 size={15} />
            Delete
          </button>
        </div>

        {pageError && <p className="mobileFormMessage">{pageError}</p>}
      </section>
    </section>
  );
}
