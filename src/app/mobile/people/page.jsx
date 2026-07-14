"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Crown, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { getInitialMobileLanguage } from "../../../components/mobile/mobileLanguage";

const copy = {
  en: {
    label: "People",
    title: "Connected people",
    subtitle: "People connected to you through family or friend invites.",
    loading: "Loading connected people...",
    emptyTitle: "No connected people yet.",
    emptyText: "Invite family or friends with a QR code to start building your private network.",
    connect: "Connect family",
    signIn: "Please sign in to see connected people.",
    family: "Family",
    friend: "Friend",
    other: "Other",
    connected: "Connected",
    owner: "Owner",
    admin: "Admin",
    contributor: "Contributor",
    viewer: "Viewer",
    member: "Member",
    verified: "Verified",
    unverified: "Unverified",
    free: "Free",
    unknownNetwork: "Private network",
  },
  es: {
    label: "Personas",
    title: "Personas conectadas",
    subtitle: "Personas conectadas contigo por invitaciones de familia o amigos.",
    loading: "Cargando personas conectadas...",
    emptyTitle: "Todavia no hay personas conectadas.",
    emptyText: "Invita familia o amigos con un codigo QR para empezar tu red privada.",
    connect: "Conectar familia",
    signIn: "Inicia sesion para ver personas conectadas.",
    family: "Familia",
    friend: "Amigo",
    other: "Otra",
    connected: "Conectado",
    owner: "Dueno",
    admin: "Admin",
    contributor: "Colaborador",
    viewer: "Visitante",
    member: "Miembro",
    verified: "Verificado",
    unverified: "No verificado",
    free: "Free",
    unknownNetwork: "Red privada",
  },
};

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function relationshipLabel(value, t) {
  if (value === "family") return t.family;
  if (value === "friend") return t.friend;
  if (value === "other") return t.other;
  return t.connected;
}

function roleLabel(value, t) {
  if (value === "owner") return t.owner;
  if (value === "admin") return t.admin;
  if (value === "contributor") return t.contributor;
  if (value === "viewer") return t.viewer;
  return t.member;
}

function getProfileName(profile, fallback) {
  return (
    profile?.display_name ||
    profile?.username ||
    profile?.full_name ||
    profile?.email ||
    fallback ||
    "Connected member"
  );
}

function getAvatarUrl(profile = {}) {
  return profile.avatar_url || profile.profile_photo_url || "";
}

function getPremium(profile = {}) {
  return profile.premium_tier || profile.subscription_tier || "";
}

function isVerified(profile = {}) {
  return profile.verification_status === "verified" || profile.kyc_status === "verified";
}

function tierClass(value = "free") {
  const clean = String(value || "free").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return clean || "free";
}

export default function MobilePeoplePage() {
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
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

    return () => {
      window.removeEventListener("vozeterna-language-change", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    loadPeople();
  }, []);

  const uniquePeople = useMemo(() => {
    const seen = new Set();

    return people.filter((person) => {
      const key = `${person.userId}-${person.networkId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [people]);

  async function loadPeople() {
    setLoading(true);
    setMessage("");

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    setUser(currentUser || null);

    if (!currentUser) {
      setLoading(false);
      setPeople([]);
      setMessage(t.signIn);
      return;
    }

    const myMemberships = await supabase
      .from("network_members")
      .select("*")
      .eq("user_id", currentUser.id);

    if (myMemberships.error) {
      setMessage(myMemberships.error.message);
      setLoading(false);
      return;
    }

    const networkIds = [...new Set((myMemberships.data || []).map((item) => item.network_id).filter(Boolean))];

    if (networkIds.length === 0) {
      setPeople([]);
      setLoading(false);
      return;
    }

    const [membersResult, networksResult] = await Promise.all([
      supabase
        .from("network_members")
        .select("*")
        .in("network_id", networkIds)
        .neq("user_id", currentUser.id),
      supabase
        .from("networks")
        .select("*")
        .in("id", networkIds),
    ]);

    if (membersResult.error) {
      setMessage(membersResult.error.message);
      setLoading(false);
      return;
    }

    const otherMembers = membersResult.data || [];
    const otherUserIds = [...new Set(otherMembers.map((item) => item.user_id).filter(Boolean))];
    const networksById = new Map((networksResult.data || []).map((network) => [network.id, network]));
    const profilesByUserId = await loadProfilesByUserIds(otherUserIds);

    setPeople(
      otherMembers.map((member) => {
        const profile = profilesByUserId.get(member.user_id) || {};
        const network = networksById.get(member.network_id) || {};
        const premium = getPremium(profile);

        return {
          userId: member.user_id,
          networkId: member.network_id,
          profile,
          network,
          name: getProfileName(profile, member.email),
          avatarUrl: getAvatarUrl(profile),
          relationship: relationshipLabel(member.relationship_type || network.type, t),
          role: roleLabel(member.role, t),
          networkName: network.name || network.title || t.unknownNetwork,
          verified: isVerified(profile),
          premium,
          premiumLabel: titleCase(premium || t.free),
        };
      })
    );

    setLoading(false);
  }

  async function loadProfilesByUserIds(userIds) {
    const profilesByUserId = new Map();

    if (userIds.length === 0) return profilesByUserId;

    const byId = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    (byId.data || []).forEach((profile) => {
      profilesByUserId.set(profile.id, profile);
    });

    const byUserId = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", userIds);

    if (!byUserId.error) {
      (byUserId.data || []).forEach((profile) => {
        profilesByUserId.set(profile.user_id, profile);
      });
    }

    return profilesByUserId;
  }

  return (
    <section className="mobileScreenStack mobilePeoplePage">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">{t.label}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <Link href="/mobile/connect" className="mobilePrimaryButton">
          {t.connect}
        </Link>
      </div>

      {loading && <div className="mobileEmptyCard">{t.loading}</div>}

      {!loading && message && <div className="mobileEmptyCard">{message}</div>}

      {!loading && !message && uniquePeople.length === 0 && (
        <section className="mobileEmptyCard mobilePeopleEmpty">
          <UsersRound size={30} />
          <strong>{t.emptyTitle}</strong>
          <p>{t.emptyText}</p>
          <Link href="/mobile/connect" className="mobilePrimaryButton">
            {t.connect}
          </Link>
        </section>
      )}

      {!loading && uniquePeople.length > 0 && (
        <div className="mobilePeopleList">
          {uniquePeople.map((person) => {
            const premiumActive = Boolean(person.premium && String(person.premium).toLowerCase() !== "free");

            return (
              <article className="mobilePeopleCard" key={`${person.userId}-${person.networkId}`}>
                <div className="mobilePeopleAvatar">
                  {person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : <UserRound size={26} />}
                </div>

                <div className="mobilePeopleCardBody">
                  <div className="mobilePeopleCardTop">
                    <div>
                      <strong>{person.name}</strong>
                      <p>{person.relationship} - {person.role}</p>
                    </div>
                    {person.verified && (
                      <span className="mobileStatusBadge verified">
                        <ShieldCheck size={13} />
                        {t.verified}
                      </span>
                    )}
                  </div>

                  <p>{person.networkName}</p>

                  <div className="mobileBadgeRow">
                    {!person.verified && (
                      <span className="mobileStatusBadge unverified">{t.unverified}</span>
                    )}
                    {premiumActive && (
                      <span className={`mobileStatusBadge premium tier-${tierClass(person.premium)}`}>
                        <Crown size={13} />
                        {person.premiumLabel}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
