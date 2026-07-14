"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "COMMENTS",
    title: "Comments",
    subtitle: "Private comments for this feed item.",
    backFeed: "Back to feed",
    loading: "Loading comments...",
    notFound: "Feed item not found.",
    subjectFallback: "Memory comments",
    empty: "No comments yet.",
    placeholder: "Write a comment...",
    send: "Send",
    sending: "Sending...",
    writeFirst: "Please write a comment before sending.",
    signIn: "Please sign in before commenting.",
    sendFailed: "Could not send comment.",
    loadFailed: "Could not load comments.",
    someone: "Someone",
    commented: "commented on",
  },
  es: {
    label: "COMENTARIOS",
    title: "Comentarios",
    subtitle: "Comentarios privados para este elemento del feed.",
    backFeed: "Volver al feed",
    loading: "Cargando comentarios...",
    notFound: "Elemento del feed no encontrado.",
    subjectFallback: "Comentarios del recuerdo",
    empty: "Todavia no hay comentarios.",
    placeholder: "Escribe un comentario...",
    send: "Enviar",
    sending: "Enviando...",
    writeFirst: "Escribe un comentario antes de enviar.",
    signIn: "Inicia sesion antes de comentar.",
    sendFailed: "No se pudo enviar el comentario.",
    loadFailed: "No se pudieron cargar los comentarios.",
    someone: "Alguien",
    commented: "comento en",
  },
};

function getProfileName(profile, fallback) {
  return (
    profile?.display_name ||
    profile?.username ||
    profile?.full_name ||
    profile?.email ||
    fallback
  );
}

export default function MobileCommentsPage() {
  const params = useParams();
  const activityId = params?.activityId;

  const [language, setLanguage] = useState("en");
  const [activity, setActivity] = useState(null);
  const [comments, setComments] = useState([]);
  const [profileNames, setProfileNames] = useState({});
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const t = copy[language] || copy.en;

  useEffect(() => {
    setLanguage(getInitialMobileLanguage());

    function handleLanguageChange(event) {
      if (event.detail === "en" || event.detail === "es") {
        setLanguage(event.detail);
      }
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);
    return () => window.removeEventListener("vozeterna-language-change", handleLanguageChange);
  }, []);

  useEffect(() => {
    if (activityId) {
      loadComments(activityId);
    }
  }, [activityId]);

  async function loadProfilesForComments(commentRows) {
    const userIds = [
      ...new Set((commentRows || []).map((comment) => comment.created_by).filter(Boolean)),
    ];

    if (userIds.length === 0) {
      setProfileNames({});
      return;
    }

    const withEmail = await supabase
      .from("profiles")
      .select("id, display_name, username, full_name, email")
      .in("id", userIds);

    const profileRows = withEmail.error
      ? (await supabase
          .from("profiles")
          .select("id, display_name, username, full_name")
          .in("id", userIds)).data || []
      : withEmail.data || [];

    const names = profileRows.reduce((map, profile) => {
      map[profile.id] = getProfileName(profile, "");
      return map;
    }, {});

    setProfileNames(names);
  }

  async function loadProfileName(userId, fallback) {
    if (!userId) return fallback;
    if (profileNames[userId]) return profileNames[userId];

    const withEmail = await supabase
      .from("profiles")
      .select("id, display_name, username, full_name, email")
      .eq("id", userId)
      .maybeSingle();

    if (!withEmail.error && withEmail.data) {
      return getProfileName(withEmail.data, fallback);
    }

    const basic = await supabase
      .from("profiles")
      .select("id, display_name, username, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (!basic.error && basic.data) {
      return getProfileName(basic.data, fallback);
    }

    return fallback;
  }

  async function loadComments(id) {
    setLoading(true);
    setMessage("");

    try {
      const { data: activityData, error: activityError } = await supabase
        .from("network_activity")
        .select(`
          id,
          network_id,
          memory_id,
          vault_id,
          title,
          created_at,
          memories (
            id,
            title,
            created_by
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (activityError) {
        setMessage(activityError.message);
        setActivity(null);
        setComments([]);
        setLoading(false);
        return;
      }

      if (!activityData) {
        setMessage(t.notFound);
        setActivity(null);
        setComments([]);
        setLoading(false);
        return;
      }

      const { data: commentData, error: commentError } = await supabase
        .from("network_comments")
        .select("id, body, created_at, created_by")
        .eq("activity_id", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (commentError) {
        setMessage(commentError.message);
      }

      const rows = commentData || [];
      setActivity(activityData);
      setComments(rows);
      await loadProfilesForComments(rows);
      setLoading(false);
    } catch (error) {
      setMessage(error.message || t.loadFailed);
      setLoading(false);
    }
  }

  async function createCommentActivity({ user, commentBody }) {
    if (!activity?.network_id || !activity?.id) return;

    const commenterName = await loadProfileName(
      user.id,
      user.user_metadata?.display_name || user.email || t.someone
    );
    const memoryTitle = activity.memories?.title || activity.title || t.subjectFallback;

    await supabase.from("network_activity").insert({
      network_id: activity.network_id,
      vault_id: activity.vault_id || null,
      memory_id: activity.memory_id || null,
      actor_id: user.id,
      activity_type: "comment_added",
      title: `${commenterName} ${t.commented} ${memoryTitle}`,
      feed_visibility: "network",
      is_commentable: false,
      metadata: {
        source: "mobile_comment",
        parent_activity_id: activity.id,
        commenter_name: commenterName,
        memory_title: memoryTitle,
        body_preview: commentBody.slice(0, 140),
      },
    });
  }

  async function sendComment(event) {
    event.preventDefault();

    const cleanBody = body.trim();

    if (!cleanBody) {
      setMessage(t.writeFirst);
      return;
    }

    if (!activity?.id || sending) return;

    setSending(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(t.signIn);
        setSending(false);
        return;
      }

      const { error } = await supabase.from("network_comments").insert({
        network_id: activity.network_id,
        activity_id: activity.id,
        memory_id: activity.memory_id || null,
        created_by: user.id,
        body: cleanBody,
      });

      if (error) {
        setMessage(error.message);
        setSending(false);
        return;
      }

      try {
        await createCommentActivity({ user, commentBody: cleanBody });
      } catch {
        // TODO: A future dedicated notifications table can make comment notifications
        // richer. For MVP, comments remain saved even if activity notification insert fails.
      }

      setBody("");
      setSending(false);
      loadComments(activity.id);
    } catch (error) {
      setMessage(error.message || t.sendFailed);
      setSending(false);
    }
  }

  return (
    <section className="mobileScreenStack">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="mobileCommentsPanel">
        <Link href="/mobile/feed" className="mobileBackToFeed">
          {t.backFeed}
        </Link>

        {loading ? (
          <p className="mobileFormHelper">{t.loading}</p>
        ) : !activity ? (
          <p className="mobileFormMessage">{message || t.notFound}</p>
        ) : (
          <>
            <div className="mobileCommentSubject">
              <MessageCircle size={19} />
              <div>
                <strong>{activity.title || t.subjectFallback}</strong>
                <span>{new Date(activity.created_at).toLocaleString(language === "es" ? "es-MX" : "en-US")}</span>
              </div>
            </div>

            <div className="mobileCommentList">
              {comments.length === 0 ? (
                <p className="mobileFormHelper">{t.empty}</p>
              ) : (
                comments.map((comment) => (
                  <article className="mobileCommentBubble" key={comment.id}>
                    <strong className="mobileCommentAuthor">
                      {profileNames[comment.created_by] || t.someone}
                    </strong>
                    <p>{comment.body}</p>
                    <span>{new Date(comment.created_at).toLocaleString(language === "es" ? "es-MX" : "en-US")}</span>
                  </article>
                ))
              )}
            </div>

            <form className="mobileCommentForm" onSubmit={sendComment}>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t.placeholder}
              />

              <button type="submit" disabled={sending || !body.trim()}>
                <Send size={16} />
                {sending ? t.sending : t.send}
              </button>
            </form>

            {message && <p className="mobileFormMessage">{message}</p>}
          </>
        )}
      </section>
    </section>
  );
}
