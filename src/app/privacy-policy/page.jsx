import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | VozEterna",
  description:
    "Read the VozEterna Privacy Policy for Founder Beta users, including how family legacy information, recordings, photos, videos, and inquiries may be handled.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="infoPage legalPage">
      <header className="infoHeader">
        <Link href="/" className="infoLogo">
          <Image src="/brand/logo-primary.png" alt="VozEterna logo" width={170} height={48} priority />
        </Link>

        <Link href="/" className="backHome">
          Back to Home / Volver al Inicio
        </Link>
      </header>

      <section className="infoHero">
        <p className="infoEyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="infoSubtitle">Last updated: July 2026</p>
      </section>

      <section className="legalContent">
        <p>
          VozEterna is currently in Founder Beta. This Privacy Policy explains how we may collect, use, and protect
          information submitted through our website, forms, emails, and early access process.
        </p>

        <h2>1. Information We May Collect</h2>
        <p>We may collect information such as:</p>
        <ul>
          <li>Name, email address, phone number, and contact details.</li>
          <li>Family legacy or memorial inquiry details.</li>
          <li>Uploaded or shared files such as voice recordings, videos, photos, messages, and documents.</li>
          <li>Funeral home or partner inquiry information.</li>
          <li>Technical information such as website usage, browser type, and form submissions.</li>
        </ul>

        <h2>2. How We Use Information</h2>
        <p>We may use submitted information to:</p>
        <ul>
          <li>Respond to inquiries and support requests.</li>
          <li>Provide Founder Beta guidance and onboarding.</li>
          <li>Organize family legacy materials and memorial-related content.</li>
          <li>Improve VozEterna services, forms, and user experience.</li>
          <li>Communicate about updates, availability, and service options.</li>
        </ul>

        <h2>3. Family Memories, Recordings, Photos, and Videos</h2>
        <p>
          VozEterna treats family legacy materials as sensitive and personal. During Founder Beta, these materials
          may be handled manually through private cloud folders, approved upload methods, email communication, or
          other tools used to support early users.
        </p>

        <h2>4. Privacy by Default</h2>
        <p>
          VozEterna is designed around the principle of privacy by default. Families should decide what remains
          private, what is shared with family members, and what may appear on a public QR memorial page.
        </p>

        <h2>5. AI and Future Interactive Features</h2>
        <p>
          VozEterna may explore future features that use transcripts, recordings, or approved family memories to
          help future generations search, learn, and ask questions based on preserved materials. Any future AI voice
          or interactive legacy feature should require appropriate consent, family authorization, and clear privacy
          controls.
        </p>

        <h2>6. Sharing of Information</h2>
        <p>
          We do not sell family memories, voice recordings, photos, videos, or personal legacy materials. We may use
          trusted service providers to operate forms, hosting, storage, communication, analytics, or other technical
          functions needed to provide the service.
        </p>

        <h2>7. Data Retention and Deletion</h2>
        <p>
          Founder Beta users may contact us to request access, correction, export, or deletion of submitted materials.
          Some information may be retained when necessary for legal, operational, security, or recordkeeping purposes.
        </p>

        <h2>8. Security</h2>
        <p>
          We aim to use reasonable safeguards to protect submitted information. However, no online service or storage
          system can be guaranteed to be completely secure.
        </p>

        <h2>9. Children's Privacy</h2>
        <p>
          VozEterna is not intended for children to use without parent or guardian involvement. Families are responsible
          for ensuring they have permission to submit or share content involving minors.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about privacy may be sent to{" "}
          <a href="mailto:felipe.frias.pcs@gmail.com">felipe.frias.pcs@gmail.com</a>.
        </p>

        <p className="legalNote">
          This policy is provided for Founder Beta transparency and should be reviewed by a qualified legal professional
          before commercial launch.
        </p>
      </section>
    </main>
  );
}