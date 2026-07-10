import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "About VozEterna | Family Legacy and Memorial Platform",
  description:
    "Learn about VozEterna, a bilingual family legacy platform helping families preserve voices, stories, photos, videos, and memories for future generations.",
};

export default function AboutPage() {
  return (
    <main className="infoPage">
      <header className="infoHeader">
        <Link href="/" className="infoLogo">
          <Image src="/brand/logo-primary.png" alt="VozEterna logo" width={170} height={48} priority />
        </Link>

        <Link href="/" className="backHome">
          Back to Home / Volver al Inicio
        </Link>
      </header>

      <section className="infoHero">
        <p className="infoEyebrow">VozEterna</p>
        <h1>About VozEterna</h1>
        <p className="infoSubtitle">Acerca de VozEterna</p>
      </section>

      <section className="infoGrid">
        <article className="infoCard">
          <h2>English</h2>
          <p>
            VozEterna is a bilingual family legacy and memorial platform created to help families preserve
            a loved one's voice, stories, photos, videos, final messages, and digital memories in one private,
            meaningful place.
          </p>
          <p>
            Our mission is simple: help families capture the stories that are often left unrecorded until it is
            too late. A phone can record a file, but VozEterna helps guide, organize, preserve, and share a
            legacy for children, grandchildren, and future generations.
          </p>
          <p>
            VozEterna is currently in Founder Beta. During this stage, we are working closely with early families
            and funeral home partners to shape the platform with care, privacy, and respect.
          </p>
        </article>

        <article className="infoCard">
          <h2>Español</h2>
          <p>
            VozEterna es una plataforma bilingue de legado familiar y memorial creada para ayudar a las familias
            a preservar la voz, historias, fotos, videos, mensajes finales y recuerdos digitales de un ser querido.
          </p>
          <p>
            Nuestra mision es ayudar a las familias a capturar las historias que muchas veces no se graban hasta
            que ya es demasiado tarde. Un celular puede grabar un archivo, pero VozEterna ayuda a guiar, organizar,
            preservar y compartir un legado para hijos, nietos y futuras generaciones.
          </p>
          <p>
            VozEterna se encuentra actualmente en Programa Fundador. En esta etapa trabajamos de cerca con familias
            y posibles aliados funerarios para construir la plataforma con cuidado, privacidad y respeto.
          </p>
        </article>
      </section>

      <section className="infoBanner">
        <strong>Our belief / Nuestra creencia</strong>
        <p>
          A family should not lose a voice, a blessing, a story, or a memory simply because it was left on an old phone,
          a forgotten folder, or a device that no longer works.
        </p>
      </section>

      <section className="infoContact">
        <h2>Contact / Contacto</h2>
        <p>For questions, early access, partnerships, or support, contact us directly.</p>
        <a href="mailto:felipe.frias.pcs@gmail.com?subject=VozEterna%20Inquiry" className="infoButton">
          Email VozEterna
        </a>
      </section>
    </main>
  );
}