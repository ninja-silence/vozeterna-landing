"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import { useAppLanguage } from "../../../../../lib/useAppLanguage";

const copy = {
  en: {
    eyebrow: "Edit Legacy Profile",
    title: "Customize This Legacy Profile",
    subtitle:
      "Update the profile photo, life story, relationship details, and public memorial settings for this loved one.",
    loading: "Loading...",
    notFound: "Profile not found",
    notFoundText: "This loved one profile may not exist or you may not have access to it.",
    backProfiles: "Back to profiles",
    backProfile: "Back to profile",
    save: "Save changes",
    saving: "Saving...",
    saved: "Profile updated successfully.",
    fullName: "Full name",
    relationship: "Relationship",
    birthDate: "Birth date",
    deathDate: "Death date",
    bio: "Bio or life story",
    profilePhoto: "Profile photo",
    choosePhoto: "Choose new profile photo",
    photoHelp:
      "This photo appears on the private profile and public memorial page if enabled.",
    memorialEyebrow: "Public Memorial",
    memorialTitle: "Memorial page settings",
    memorialText:
      "Create an optional public page for this loved one. Private vault memories stay private unless you manually choose to show them.",
    enableMemorial: "Enable public memorial page",
    memorialSlug: "Memorial page URL",
    memorialHelp:
      "Only the profile photo, name, relationship, bio, and approved public memories will appear.",
    preview: "Preview memorial",
    required: "Full name is required.",
    uploadError: "Could not upload profile photo.",
    trustTitle: "Private by default",
    trustText:
      "Turning on a memorial page does not expose private memories. You choose which memories appear publicly.",
  },
  es: {
    eyebrow: "Editar perfil de legado",
    title: "Personaliza este perfil de legado",
    subtitle:
      "Actualiza la foto, historia de vida, parentesco y ajustes de la página memorial pública para este ser querido.",
    loading: "Cargando...",
    notFound: "Perfil no encontrado",
    notFoundText: "Este perfil puede no existir o quizá no tienes acceso.",
    backProfiles: "Volver a perfiles",
    backProfile: "Volver al perfil",
    save: "Guardar cambios",
    saving: "Guardando...",
    saved: "Perfil actualizado correctamente.",
    fullName: "Nombre completo",
    relationship: "Parentesco",
    birthDate: "Fecha de nacimiento",
    deathDate: "Fecha de fallecimiento",
    bio: "Biografía o historia de vida",
    profilePhoto: "Foto de perfil",
    choosePhoto: "Elegir nueva foto de perfil",
    photoHelp:
      "Esta foto aparece en el perfil privado y en la página memorial pública si está activada.",
    memorialEyebrow: "Memorial público",
    memorialTitle: "Ajustes de la página memorial",
    memorialText:
      "Crea una página pública opcional para este ser querido. Los recuerdos privados permanecen privados a menos que tú decidas mostrarlos.",
    enableMemorial: "Activar página memorial pública",
    memorialSlug: "URL de la página memorial",
    memorialHelp:
      "Solo aparecerán la foto, nombre, parentesco, biografía y recuerdos aprobados como públicos.",
    preview: "Ver memorial",
    required: "El nombre completo es obligatorio.",
    uploadError: "No se pudo subir la foto de perfil.",
    trustTitle: "Privado por defecto",
    trustText:
      "Activar una página memorial no expone los recuerdos privados. Tú eliges qué recuerdos aparecen públicamente.",
  },
};

export default function EditLovedOnePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const language = useAppLanguage();
  const t = copy[language];

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhotoPath, setProfilePhotoPath] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [memorialPublic, setMemorialPublic] = useState(false);
  const [memorialSlug, setMemorialSlug] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("loved_ones")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setProfile(data);
      setFullName(data.full_name || "");
      setRelationship(data.relationship || "");
      setBirthDate(data.birth_date || "");
      setDeathDate(data.death_date || "");
      setBio(data.bio || "");
      setProfilePhotoPath(data.profile_photo_path || "");
      setMemorialPublic(Boolean(data.memorial_public));
      setMemorialSlug(data.memorial_slug || makeSlug(data.full_name || ""));

      if (data.profile_photo_path) {
        const { data: signedPhotoData } = await supabase.storage
          .from("family-media")
          .createSignedUrl(data.profile_photo_path, 60 * 10);

        if (signedPhotoData?.signedUrl) {
          setProfilePhotoUrl(signedPhotoData.signedUrl);
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, [id]);

  function makeSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getInitials(name) {
    return (
      name
        ?.split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "VE"
    );
  }

  function safeFileName(name) {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  }

  async function uploadProfilePhoto() {
    if (!profilePhotoFile) return profilePhotoPath;

    const cleanName = safeFileName(profilePhotoFile.name);
    const filePath = `${user.id}/${id}/profile-${Date.now()}-${cleanName}`;

    const { error } = await supabase.storage
      .from("family-media")
      .upload(filePath, profilePhotoFile);

    if (error) {
      throw new Error(t.uploadError);
    }

    return filePath;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!fullName.trim()) {
      setMessage(t.required);
      return;
    }

    setSaving(true);

    try {
      const finalProfilePhotoPath = await uploadProfilePhoto();

      const finalSlug = memorialSlug.trim()
        ? makeSlug(memorialSlug)
        : makeSlug(fullName);

      const { error } = await supabase
        .from("loved_ones")
        .update({
          full_name: fullName.trim(),
          relationship: relationship.trim() || null,
          birth_date: birthDate || null,
          death_date: deathDate || null,
          bio: bio.trim() || null,
          profile_photo_path: finalProfilePhotoPath || null,
          memorial_public: memorialPublic,
          memorial_slug: finalSlug,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage(t.saved);
      setSaving(false);

      router.refresh();
    } catch (error) {
      setMessage(error.message);
      setSaving(false);
    }
  }

  function handlePhotoChange(event) {
    const nextFile = event.target.files?.[0] || null;
    setProfilePhotoFile(nextFile);

    if (nextFile) {
      setProfilePhotoUrl(URL.createObjectURL(nextFile));
    }
  }

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.loading}</h1>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.notFound}</h1>
          <p>{t.notFoundText}</p>

          <Link href="/app/loved-ones" className="appButton">
            {t.backProfiles}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell editProfileShell">
      <section className="editProfileHero">
        <div>
          <p className="appEyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>

          <div className="buttonRow">
            <Link href={`/app/loved-ones/${id}`} className="appButton secondary">
              {t.backProfile}
            </Link>

            {memorialPublic && memorialSlug && (
              <Link href={`/memorial/${makeSlug(memorialSlug)}`} className="appButton ghost">
                {t.preview}
              </Link>
            )}
          </div>
        </div>

        <aside className="editProfilePhotoCard">
          <div className="editProfilePhoto">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt={fullName} />
            ) : (
              <span>{getInitials(fullName)}</span>
            )}
          </div>

          <p className="appEyebrow">{t.profilePhoto}</p>
          <p>{t.photoHelp}</p>

          <label className="appButton secondary photoUploadButton" htmlFor="profilePhotoFile">
            {t.choosePhoto}
          </label>

          <input
            id="profilePhotoFile"
            className="visuallyHiddenFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
          />
        </aside>
      </section>

      <section className="editProfileGrid">
        <form className="editProfileForm" onSubmit={handleSubmit}>
          {message && <div className="successBox">{message}</div>}

          <label className="fieldLabel" htmlFor="fullName">
            {t.fullName}
          </label>
          <input
            id="fullName"
            className="appInput"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (!memorialSlug) setMemorialSlug(makeSlug(e.target.value));
            }}
          />

          <label className="fieldLabel" htmlFor="relationship">
            {t.relationship}
          </label>
          <input
            id="relationship"
            className="appInput"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
          />

          <div className="twoColumnFields">
            <div>
              <label className="fieldLabel" htmlFor="birthDate">
                {t.birthDate}
              </label>
              <input
                id="birthDate"
                className="appInput"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            <div>
              <label className="fieldLabel" htmlFor="deathDate">
                {t.deathDate}
              </label>
              <input
                id="deathDate"
                className="appInput"
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
              />
            </div>
          </div>

          <label className="fieldLabel" htmlFor="bio">
            {t.bio}
          </label>
          <textarea
            id="bio"
            className="appTextarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <div className="buttonRow">
            <button type="submit" className="appButton" disabled={saving}>
              {saving ? t.saving : t.save}
            </button>

            <Link href={`/app/loved-ones/${id}`} className="appButton secondary">
              {t.backProfile}
            </Link>
          </div>
        </form>

        <aside className="editMemorialCard">
          <p className="appEyebrow">{t.memorialEyebrow}</p>
          <h2>{t.memorialTitle}</h2>
          <p>{t.memorialText}</p>

          <label className="checkRow memorialSwitch">
            <input
              type="checkbox"
              checked={memorialPublic}
              onChange={(e) => setMemorialPublic(e.target.checked)}
            />
            <span>{t.enableMemorial}</span>
          </label>

          <label className="fieldLabel" htmlFor="memorialSlug">
            {t.memorialSlug}
          </label>

          <div className="slugPreviewRow">
            <span>/memorial/</span>
            <input
              id="memorialSlug"
              className="appInput"
              value={memorialSlug}
              onChange={(e) => setMemorialSlug(e.target.value)}
              placeholder="rosa-frias-lopez"
            />
          </div>

          <p className="helperText">{t.memorialHelp}</p>

          <div className="privateVaultNote">
            <strong>{t.trustTitle}</strong>
            <p>{t.trustText}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}