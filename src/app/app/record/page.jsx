"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AudioRecorder from "../../../components/app/AudioRecorder";
import CameraRecorder from "../../../components/app/CameraRecorder";
import { supabase } from "../../../lib/supabaseClient";
import { useAppLanguage } from "../../../lib/useAppLanguage";

const copy = {
  en: {
    step: "Record Memories",
    title: "Record Voice & Video Memories",
    subtitle:
      "Capture blessings, stories, prayers, messages, and moments that your family can preserve for generations.",
    review: "Review consent agreement",
    back: "Back to dashboard",
    signInTitle: "Please sign in",
    signInText: "You need to sign in before recording private family memories.",
    signIn: "Sign in",
    noConsentTitle: "Consent required",
    noConsentText:
      "Before recording voice or video memories, please complete the consent and signature agreement.",
    completeConsent: "Complete consent",
    noProfilesTitle: "Create a loved one profile first",
    noProfilesText:
      "Before recording memories, create a profile for the person these memories belong to.",
    createProfile: "Create profile",
    who: "Who is this memory for?",
    kind: "What kind of memory is this?",
    note: "Optional memory note",
    notePlaceholder:
      "Example: Mom's blessing, Dad's advice, Grandma's prayer, or a special family message.",
    guideEyebrow: "Need ideas?",
    guideTitle: "Record something meaningful",
    guideText:
      "You do not need a perfect speech. A simple message, memory, prayer, or blessing can become priceless to your family later.",
    privateTitle: "Private by default",
    privateText:
      "Recordings stay in your private vault unless you choose to share them on a public memorial page.",
    prompts: [
      "Share a favorite story",
      "Leave a blessing",
      "Record a prayer",
      "Say what made them special",
      "Tell your family what you want remembered",
      "Describe a favorite moment",
    ],
    audioTitle: "Voice memory",
    videoTitle: "Video memory",
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
    step: "Grabar recuerdos",
    title: "Grabar recuerdos de voz y video",
    subtitle:
      "Captura bendiciones, historias, oraciones, mensajes y momentos que tu familia pueda preservar por generaciones.",
    review: "Revisar consentimiento",
    back: "Volver al inicio",
    signInTitle: "Por favor inicia sesión",
    signInText: "Necesitas iniciar sesión antes de grabar recuerdos familiares privados.",
    signIn: "Iniciar sesión",
    noConsentTitle: "Consentimiento requerido",
    noConsentText:
      "Antes de grabar recuerdos de voz o video, completa el consentimiento y la firma.",
    completeConsent: "Completar consentimiento",
    noProfilesTitle: "Primero crea un perfil de ser querido",
    noProfilesText:
      "Antes de grabar recuerdos, crea un perfil para la persona a la que pertenecen estos recuerdos.",
    createProfile: "Crear perfil",
    who: "¿Para quién es este recuerdo?",
    kind: "¿Qué tipo de recuerdo es?",
    note: "Nota opcional del recuerdo",
    notePlaceholder:
      "Ejemplo: La bendición de mamá, el consejo de papá, la oración de abuela o un mensaje familiar especial.",
    guideEyebrow: "¿Necesitas ideas?",
    guideTitle: "Graba algo con significado",
    guideText:
      "No necesitas un discurso perfecto. Un mensaje sencillo, recuerdo, oración o bendición puede volverse invaluable para tu familia después.",
    privateTitle: "Privado por defecto",
    privateText:
      "Las grabaciones permanecen en tu bóveda privada a menos que decidas compartirlas en una página memorial pública.",
    prompts: [
      "Comparte una historia favorita",
      "Deja una bendición",
      "Graba una oración",
      "Di qué hacía especial a esa persona",
      "Cuenta lo que quieres que tu familia recuerde",
      "Describe un momento favorito",
    ],
    audioTitle: "Recuerdo de voz",
    videoTitle: "Recuerdo en video",
    types: {
      photo_of_person: "Foto de esta persona",
      photo_from_person: "Foto de esta persona o guardada por ella",
      story_about_person: "Historia sobre esta persona",
      message_from_person: "Mensaje de esta persona",
      voice_of_person: "Voz de esta persona",
      family_memory: "Recuerdo familiar conectado a esta persona",
      document_or_keepsake: "Documento o recuerdo especial",
    },
  },
};

export default function RecordPage() {
  const language = useAppLanguage();
  const t = copy[language];

  const [user, setUser] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [lovedOnes, setLovedOnes] = useState([]);
  const [selectedLovedOneId, setSelectedLovedOneId] = useState("");
  const [memoryType, setMemoryType] = useState("voice_of_person");
  const [memoryNote, setMemoryNote] = useState("");
  const [loading, setLoading] = useState(true);

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

  function translateRelationship(value) {
    if (!value) return "";

    if (language !== "es") return value;

    const relationshipMap = {
      Mother: "Madre",
      Father: "Padre",
      Brother: "Hermano",
      Sister: "Hermana",
      Grandmother: "Abuela",
      Grandfather: "Abuelo",
      Grandma: "Abuela",
      Grandpa: "Abuelo",
      Aunt: "Tía",
      Uncle: "Tío",
      Cousin: "Primo/a",
      Son: "Hijo",
      Daughter: "Hija",
      Wife: "Esposa",
      Husband: "Esposo",
      Friend: "Amigo/a",
    };

    return relationshipMap[value] || value;
  }

  if (loading) {
    return (
      <main className="appShell">
        <section className="appHero compact">
          <p className="appEyebrow">{t.step}</p>
          <h1>{language === "es" ? "Cargando..." : "Loading..."}</h1>
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
    <main className="appShell recordGuidedShell">
      <section className="recordGuidedHero">
        <div>
          <p className="appEyebrow">{t.step}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>

          <div className="buttonRow">
            <Link href="/app/consent" className="appButton secondary">
              {t.review}
            </Link>
            <Link href="/app/library" className="appButton ghost">
              {language === "es" ? "Ver biblioteca" : "View library"}
            </Link>
          </div>
        </div>

        <aside className="recordPromptCard">
          <p className="appEyebrow">{t.guideEyebrow}</p>
          <h2>{t.guideTitle}</h2>
          <p>{t.guideText}</p>

          <div className="recordPromptList">
            {t.prompts.map((prompt) => (
              <span key={prompt}>{prompt}</span>
            ))}
          </div>

          <div className="privateVaultNote recordPrivateNote">
            <strong>{t.privateTitle}</strong>
            <p>{t.privateText}</p>
          </div>
        </aside>
      </section>

      <section className="recordSetupGrid">
        <div className="recordSetupPanel">
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
                {person.relationship ? ` — ${translateRelationship(person.relationship)}` : ""}
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
        </div>

        <div className="recordMiniGuide">
          <span>VE</span>
          <h2>{language === "es" ? "Respira. Habla con calma." : "Breathe. Speak slowly."}</h2>
          <p>
            {language === "es"
              ? "No tienes que hacerlo perfecto. Lo importante es guardar la voz, la emoción y el recuerdo."
              : "It does not have to be perfect. What matters is preserving the voice, emotion, and memory."}
          </p>
        </div>
      </section>

      <section className="recorderGuidedGrid">
        <div className="recorderSectionHeader">
          <p className="appEyebrow">{t.audioTitle}</p>
        </div>

        <AudioRecorder
          language={language}
          user={user}
          lovedOneId={selectedLovedOneId}
          memoryType={memoryType}
          memoryNote={memoryNote}
        />

        <div className="recorderSectionHeader">
          <p className="appEyebrow">{t.videoTitle}</p>
        </div>

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