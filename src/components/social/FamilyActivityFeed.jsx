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

function getActivityIcon(type) {
  if (type === "reflection_added") return MessageCircle;
  if (type === "voice_added") return Mic2;
  if (type === "video_added") return Video;
  if (type === "photo_added") return ImageIcon;
  if (type === "profile_added") return UserRound;

  return UploadCloud;
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

export default function FamilyActivityFeed({ limit = 20 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  async function loadActivity() {
    setLoading(true);

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
      setLoading(false);
      return;
    }

    setActivities(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <section className="familyFeedPanel">
        <div className="familyFeedHeader">
          <p>Family Feed</p>
          <h2>Loading updates...</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="familyFeedPanel">
      <div className="familyFeedHeader">
        <p>Family Feed</p>
        <h2>Recent family activity</h2>
        <span>Private updates from vaults you belong to.</span>
      </div>

      {activities.length === 0 ? (
        <div className="familyFeedEmpty">
          <strong>No activity yet</strong>
          <p>When family members add memories or reflections, they’ll appear here.</p>
        </div>
      ) : (
        <div className="familyFeedList">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.activity_type);

            return (
              <Link
                href={
                  activity.memory_id
                    ? `/app/memories/${activity.memory_id}`
                    : `/app/loved-ones/${activity.loved_one_id}`
                }
                className="familyFeedItem"
                key={activity.id}
              >
                <span className="familyFeedIcon">
                  <Icon size={18} strokeWidth={2.2} />
                </span>

                <div>
                  <strong>{activity.title || "New family update"}</strong>
                  <p>
                    {activity.loved_ones?.full_name || "Family vault"} ·{" "}
                    {formatActivityDate(activity.created_at)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}