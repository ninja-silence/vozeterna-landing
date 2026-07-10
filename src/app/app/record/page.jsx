"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AudioRecorder from "../../../components/app/AudioRecorder";
import CameraRecorder from "../../../components/app/CameraRecorder";
import { supabase } from "../../../lib/supabaseClient";

const copy = {
  en: {
    step: "Step 2",
    title: "Record Memories",
    subtitle: "Capture voice, audio, and video memories. Consent must be completed before recording.",
    review: "Review consent agreement",
    back: "Back to app",
    signInTitle: "Please sign in",
    signInText: "You need to sign in before recording private family memories.",
    signIn: "Sign in",
    noConsentTitle: "Consent required",
    noConsentText: "Before recording voice or video memories, please complete the consent and signature agreement.",
    completeConsent: "Complete consent",
    noProfilesTitle: "Create a loved one profile first",
    noProfilesText: "Before recording memories, create a profile for the person these memories belong to.",
    createProfile: "Create profile",
    who: "Who is this memory for?",
    kind: "What kind of memory is this?",
    note: "Optional memory note",
    notePlaceholder: "Example: Mom's blessing, Dad's advice, Grandma's prayer, or a special family message.",
    types: {
      photo_of_person: "Photo of this person",
      photo_from_person: "Photo from this person",
      story_about_person: "Story about this person",
      message_from_person: "Message from this person",
      voice_of_person: "Voice of this person",
      family_memory: "Family memory connected to this person",
      document_or_keepsake: "Document or keepsake",
    },
  },
  es: {
    step: "Paso 2",
    title: "Grabar Recuerdos",
    subtitle: "Captura recuerdos de voz, audio y video. El consentimiento debe completarse antes de grabar.",
    review: "Revisar consentimiento",
    back: "Volver a la app",
    signInTitle: "Por favor inicia sesión",
    signInText: "Necesitas iniciar sesión antes de grabar recuerdos familiares privados.",
    signIn: "Iniciar sesión",
    noConsentTitle: "Consentimiento requerido",
    noConsentText: "Antes de grabar recuerdos de voz o video, completa el consentimiento y la firma.",
    completeConsent: "Completar consentimiento",
    noProfilesTitle: "Primero crea un perfil de ser querido",
    noProfilesText: "Antes de grabar recuerdos, crea un perfil para la persona a la que pertenecen estos recuerdos.",
    createProfile: "Crear perfil",
    who: "¿Para quién es este recuerdo?",
    kind: "¿Qué tipo de recuerdo es?",
    note: "Nota opcional del recuerdo",
    notePlaceholder: "Ejemplo: La bendición de mamá, el consejo de papá, la oración de abuela o un mensaje familiar especial.",
    types: {
      photo_of_person: "Foto de esta persona",
      photo_from_person: "Foto tomada o guardada por esta persona",
      story_about_person: "Historia sobre esta persona",
      message_from_person: "Mensaje de esta persona",
      voice_of_person: "Voz de esta persona",
      family_memory: "Recuerdo familiar conectado a esta persona",
      document_or_keepsake: "Documento o recuerdo especial",
    },
  },
};

export default function RecordPage() {
  const [language] = useState("en");
  const [user, setUser] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [lovedOnes, setLovedOnes] = useState([]);
  const [selectedLovedOneId, setSelectedLovedOneId] = useState("");
  const [memoryType, setMemoryType] = useState("voice_of_person");
  const [memoryNote, setMemoryNote] = useState("");
  const [loading, setLoading] = useState(true);

  const t = copy[language];

  useEffect(() => {
    async function loadRecordSetup() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data: consentData } = await supabase
        .from("consent_records")
        .select("id, full_name, accepted_at, agreement_version, language")
        .eq("user_id", currentUser.id)
        .eq("accepted", true)
        .order("accepted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (consentData?.id) {
        setHasConsent(true);

        localStorage.setItem(
          "vozeterna_voice_consent",
          JSON.stringify({
            fullName: consentData.full_name,
            accepted: true,
            acceptedAt: consentData.accepted_at,
            agreementVersion: consentData.agreement_version,
            language: consentData.language || "en",
            source: "supabase",
          })
        );
      }

      const { data: profilesData } = await supabase
        .from("loved_ones")
        .select("id, full_name, relationship")
        .order("created_at", { ascending: false });

      const profiles = profilesData || [];
      setLovedOnes(profiles);

      if (profiles.length) {
        const params = new URLSearchParams(window.location.search);
        const requestedLovedOneId = params.get("lovedOneId");
        const profileExists = profiles.some((profile) => profile.id === requestedLovedOneId);

        setSelectedLovedOneId(profileExists ? requestedLovedOneId : profiles[0].id);
      }

      setLoading(false);
    }

    loadRecordSetup();
  }, []);

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.step}</p>
          <h1>{t.title}</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.step}</p>
          <h1>{t.signInTitle}</h1>
          <p>{t.signInText}</p>

          <div className="buttonRow">
            <Link href="/app/login" className="appButton">
              {t.signIn}
            </Link>

            <Link href="/app" className="appButton secondary">
              {t.back}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!hasConsent) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.step}</p>
          <h1>{t.noConsentTitle}</h1>
          <p>{t.noConsentText}</p>

          <div className="buttonRow">
            <Link href="/app/consent" className="appButton">
              {t.completeConsent}
            </Link>

            <Link href="/app" className="appButton secondary">
              {t.back}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (lovedOnes.length === 0) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.step}</p>
          <h1>{t.noProfilesTitle}</h1>
          <p>{t.noProfilesText}</p>

          <div className="buttonRow">
            <Link href="/app/loved-ones/new" className="appButton">
              {t.createProfile}
            </Link>

            <Link href="/app" className="appButton secondary">
              {t.back}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section className="appHero compact">
        <p className="appEyebrow">{t.step}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>

        <Link href="/app/consent" className="textLink">
          {t.review}
        </Link>
      </section>

      <section className="uploadBox recordSetupBox">
        <label className="fieldLabel" htmlFor="lovedOne">
          {t.who}
        </label>

        <select
          id="lovedOne"
          className="appInput"
          value={selectedLovedOneId}
          onChange={(e) => setSelectedLovedOneId(e.target.value)}
        >
          {lovedOnes.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name}
              {person.relationship ? ` — ${person.relationship}` : ""}
            </option>
          ))}
        </select>

        <label className="fieldLabel" htmlFor="memoryType">
          {t.kind}
        </label>

        <select
          id="memoryType"
          className="appInput"
          value={memoryType}
          onChange={(e) => setMemoryType(e.target.value)}
        >
          <option value="voice_of_person">{t.types.voice_of_person}</option>
          <option value="message_from_person">{t.types.message_from_person}</option>
          <option value="story_about_person">{t.types.story_about_person}</option>
          <option value="family_memory">{t.types.family_memory}</option>
          <option value="photo_of_person">{t.types.photo_of_person}</option>
          <option value="photo_from_person">{t.types.photo_from_person}</option>
          <option value="document_or_keepsake">{t.types.document_or_keepsake}</option>
        </select>

        <label className="fieldLabel" htmlFor="memoryNote">
          {t.note}
        </label>

        <textarea
          id="memoryNote"
          className="appTextarea"
          value={memoryNote}
          onChange={(e) => setMemoryNote(e.target.value)}
          placeholder={t.notePlaceholder}
        />
      </section>

      <section className="recorderGrid">
        <AudioRecorder
          language={language}
          user={user}
          lovedOneId={selectedLovedOneId}
          memoryType={memoryType}
          memoryNote={memoryNote}
        />

        <CameraRecorder
          language={language}
          user={user}
          lovedOneId={selectedLovedOneId}
          memoryType={memoryType}
          memoryNote={memoryNote}
        />
      </section>
    </main>
  );
}