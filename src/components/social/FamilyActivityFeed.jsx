"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  MessageCircle,
  Mic2,
  UploadCloud,
  UserRound,
  Video,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import ShareMemoryButton from "./ShareMemoryButton";

function getActivityIcon(type) {
  if (type === "reflection_added") return MessageCircle;
  if (type === "voice_added") return Mic2;
  if (type === "video_added") return Video;
  if (type === "photo_added") return ImageIcon;
  if (type === "profile_added") return UserRound;

  return UploadCloud;
}

function getActivityLabel(type) {
  if (type === "reflection_added") return "New reflection";
  if (type === "voice_added") return "Voice memory";
  if (type === "video_added") return "Video memory";
  if (type === "photo_added") return "Photo memory";
  if (type === "profile_added") return "Profile update";

  return "Family update";
}

function formatActivityDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function FamilyFeedSkeleton() {
  return (
    <section className="familyFeedPanel">
      <div className="familyFeedHeader">
        <span className="skeletonLine skeletonTiny" />
        <span className="skeletonLine skeletonTitle" />
        <span className="skeletonLine skeletonText" />
      </div>

      <div className="familyFeedList">
        {[1, 2, 3, 4].map((item) => (
          <div className="familyFeedItem skeletonItem" key={item}>
            <span className="familyFeedIcon skeletonCircle" />
            <div>
              <span className="skeletonLine skeletonTextStrong" />
              <span className="skeletonLine skeletonText" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FamilyActivityFeed({ limit = 20 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");

  useEffect(() => {
    loadActivity();
  }, []);

  async function loadActivity() {
    setLoading(true);
    setFeedError("");

    const { data, error } = await supabase
      .from("vault_activity")
      .select(`
        id,
        activity_type,
        title,
        created_at,
        memory_id,
        loved_one_id,
        loved_ones (
          id,
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Family feed error:", error.message);
      setActivities([]);
      setFeedError("We could not load the family feed yet.");
      setLoading(false);
      return;
    }

    setActivities(data || []);
    setLoading(false);
  }

  if (loading) {
    return <FamilyFeedSkeleton />;
  }

  return (
    <section className="familyFeedPanel">
      <div className="familyFeedHeader">
        <p>Family Feed</p>
        <h2>Recent family activity</h2>
        <span>Private updates from vaults you belong to.</span>
      </div>

      {feedError ? (
        <div className="familyFeedEmpty">
          <strong>Feed unavailable</strong>
          <p>{feedError}</p>
          <button type="button" onClick={loadActivity} className="familyFeedRetry">
            Try again
          </button>
        </div>
      ) : activities.length === 0 ? (
        <div className="familyFeedEmpty familyFeedFirstMemory">
          <span className="familyFeedEmptyIcon">
            <Mic2 size={22} strokeWidth={2.35} />
          </span>

          <strong>Your family is waiting for your story.</strong>

          <p>
            This private feed will come alive when you or invited family members add the
            first memory, photo, voice note, or reflection.
          </p>

          <Link href="/mobile/record">Record the first memory</Link>
        </div>
      ) : (
        <div className="familyFeedList">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.activity_type);
            const activityTitle = activity.title || getActivityLabel(activity.activity_type);
            const memoryUrl =
              typeof window !== "undefined"
                ? `${window.location.origin}${
                    activity.memory_id
                      ? `/app/memories/${activity.memory_id}`
                      : `/app/loved-ones/${activity.loved_one_id}`
                  }`
                : "";

            return (
              <article className="familyFeedItem" key={activity.id}>
                <Link
                  href={
                    activity.memory_id
                      ? `/app/memories/${activity.memory_id}`
                      : `/app/loved-ones/${activity.loved_one_id}`
                  }
                  className="familyFeedMainLink"
                >
                  <span className="familyFeedIcon">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>

                  <div>
                    <strong>{activityTitle}</strong>
                    <p>
                      {activity.loved_ones?.full_name || "Family vault"} ·{" "}
                      {formatActivityDate(activity.created_at)}
                    </p>
                  </div>
                </Link>

                <ShareMemoryButton
                  className="familyFeedShare"
                  title={activityTitle}
                  text={`A private VozEterna family memory update: ${activityTitle}`}
                  url={memoryUrl}
                />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}