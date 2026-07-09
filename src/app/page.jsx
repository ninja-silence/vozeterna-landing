
"use client";

import Image from "next/image";
import { useState } from "react";

const FORMS = {
  en: {
    family: "https://tally.so/r/Xxy6pP",
    funeral: "https://tally.so/r/rjW8X2",
  },
  es: {
    family: "https://tally.so/r/zxv5d0",
    funeral: "https://tally.so/r/D4y6bR",
  },
};

const prices = {
  USD: ["$9", "$19", "$49"],
  MXN: ["$159 MXN", "$349 MXN", "$899 MXN"],
};

const copy = {
  en: {
    navHow: "How It Works",
    navFamilies: "For Families",
    navFuneral: "For Funeral Homes",
    navPricing: "Pricing",
    navAbout: "About",
    start: "Start a Legacy",

    eyebrow: "BILINGUAL LEGACY & MEMORIAL PLATFORM",
    heroTitle: "Preserve your voice for the generations who haven't met you yet.",
    heroText: "VozEterna helps families save video, audio, photos, final messages, and social legacy wishes before it is too late.",
    primaryCta: "Create a Family Legacy",
    secondaryCta: "See How It Works",
    trust: "Private by default - English and Spanish - QR memorial ready",

    features: [
      ["play", "Guided Video & Audio Recording", "Easy step-by-step prompts help capture life stories, values, prayers, recipes, and final messages."],
      ["lock", "Private Family Vault", "Securely store and organize memories only your family can access."],
      ["qr", "QR Memorial Pages", "Beautiful tribute pages to share stories and keep the memory alive."],
      ["heart", "Social Legacy Planner", "Plan wishes for social accounts, assets, and special instructions."],
    ],

    howEyebrow: "HOW IT WORKS",
    howTitle: "Three simple steps to preserve a voice forever.",
    howText: "VozEterna guides families through recording, organizing, and sharing memories in a secure legacy experience built for real people, not complicated software.",
    steps: [
      ["Record", "Invite a loved one to answer guided prompts by video or audio. Capture stories, prayers, advice, recipes, and final messages."],
      ["Preserve", "Store recordings, photos, notes, and social legacy wishes inside a private family vault with simple permissions."],
      ["Share", "Create a beautiful QR memorial page that can be shared with family, printed on programs, or used by funeral-home partners."],
      ["Keep Their Legacy Alive", "Families can continue adding memories, guestbook messages, photos, and tributes over time."],
    ],

    miniTitle: "VozEterna",
    miniSubtitle: "Family Legacy Flow",
    miniPrivate: "PRIVATE",
    miniRecording: "Recording Memory",
    miniQuestion: "What do you want your grandchildren to remember?",
    miniVault: "Private Vault",
    miniVaultMeta: "12 recordings - 48 photos",
    miniMemorial: "QR Memorial",
    miniMemorialMeta: "Ready to share",
    miniCta: "Start with the Founder Kit",

    familiesTitle: "For Families",
    familiesBullets: [
      "Preserve what matters most.",
      "Save stories, prayers, recipes, messages, and memories.",
      "Create a lasting legacy for children and generations.",
      "Peace of mind knowing their voice lives on.",
    ],

    funeralTitle: "For Funeral Homes",
    funeralBullets: [
      "Offer more. Serve better.",
      "Offer digital tribute packages families love.",
      "QR links, family upload pages, and sharing tools.",
      "White-label platform that strengthens your brand.",
    ],

    loved: "LOVED BY FAMILIES",
    testimonials: [
      ["Maria G.", "Austin, TX", "Recording my mom's stories was such a gift. My kids will always hear her voice and know her heart."],
      ["James R.", "Phoenix, AZ", "VozEterna made it easy to capture our dad's legacy. The QR page brought our family together."],
      ["Sarah L.", "Funeral Director, CA", "This adds real value. Families love having a beautiful way to remember."],
    ],

    bilingualTitle: "Built for families in English and Spanish",
    bilingualText: "Because love and legacy speak every language. Create, capture, and connect in the language that feels like home.",
    bilingualSide: "Because love and legacy speak all languages.",

    betaTitle: "Founder Beta Notice:",
    betaText: "VozEterna is currently accepting early customers. Some services are delivered manually while the full platform is being built.",

    pricingEyebrow: "SIMPLE PRICING. LASTING VALUE.",
    viewPrices: "View prices in:",
    popular: "MOST POPULAR",
    month: "/mo",
    plans: [
      ["Starter", "Perfect for individuals getting started.", ["Guided recordings", "Private vault (5GB)", "Basic sharing"], "Get Started"],
      ["Family Legacy", "Everything your family needs to preserve and share.", ["Unlimited recordings", "Private vault (50GB)", "QR memorial pages", "Legacy planner"], "Start Your Legacy"],
      ["Funeral Home Partner", "Powerful tools to serve more families.", ["Digital tribute packages", "Family upload pages", "White-label branding", "Priority support"], "Partner With Us"],
    ],

    finalTitle: "Do not wait until all you have left is photos.",
    finalText: "Capture their voice, their story, and their legacy while you still can.",
    finalCta: "Start Your Legacy Today",

    footerCompany: "COMPANY",
    footerSupport: "SUPPORT",
    footerResources: "RESOURCES",
    footerContact: "CONTACT",
    about: "About Us",
    careers: "Careers",
    press: "Press",
    help: "Help Center",
    privacy: "Privacy Policy",
    terms: "Terms",
    blog: "Blog",
    guides: "Guides",
    contact: "Contact",
    location: "Guadalajara, Jalisco, Mexico",
  },

  es: {
    navHow: "Como Funciona",
    navFamilies: "Para Familias",
    navFuneral: "Para Funerarias",
    navPricing: "Precios",
    navAbout: "Acerca de",
    start: "Iniciar un Legado",

    eyebrow: "PLATAFORMA BILINGUE DE LEGADO Y MEMORIA",
    heroTitle: "Conserva tu voz para las generaciones que aun no te conocen.",
    heroText: "VozEterna ayuda a las familias a guardar videos, audio, fotos, mensajes finales y deseos de legado digital antes de que sea demasiado tarde.",
    primaryCta: "Crear un Legado Familiar",
    secondaryCta: "Ver Como Funciona",
    trust: "Privado por defecto - Espanol e ingles - Memorial con QR listo",

    features: [
      ["play", "Grabacion Guiada en Video y Audio", "Preguntas faciles paso a paso para capturar historias de vida, valores, oraciones, recetas y mensajes finales."],
      ["lock", "Boveda Familiar Privada", "Guarda y organiza recuerdos importantes con acceso seguro solo para tu familia."],
      ["qr", "Paginas Memoriales con QR", "Hermosas paginas de homenaje para compartir historias y mantener viva la memoria."],
      ["heart", "Planificador de Legado Social", "Planea deseos para cuentas sociales, bienes, instrucciones especiales y recuerdos digitales."],
    ],

    howEyebrow: "COMO FUNCIONA",
    howTitle: "Tres pasos sencillos para preservar una voz para siempre.",
    howText: "VozEterna guia a las familias para grabar, organizar y compartir recuerdos en una experiencia segura, creada para personas reales, no para software complicado.",
    steps: [
      ["Grabar", "Invita a un ser querido a responder preguntas guiadas por video o audio. Captura historias, oraciones, consejos, recetas y mensajes finales."],
      ["Preservar", "Guarda grabaciones, fotos, notas y deseos de legado digital dentro de una boveda familiar privada con permisos sencillos."],
      ["Compartir", "Crea una hermosa pagina memorial con QR que se puede compartir con la familia, imprimir en programas o usar con funerarias aliadas."],
      ["Mantener Vivo Su Legado", "Las familias pueden seguir agregando recuerdos, mensajes, fotos y homenajes con el tiempo."],
    ],

    miniTitle: "VozEterna",
    miniSubtitle: "Flujo de Legado Familiar",
    miniPrivate: "PRIVADO",
    miniRecording: "Grabando Recuerdo",
    miniQuestion: "Que quieres que recuerden tus nietos?",
    miniVault: "Boveda Privada",
    miniVaultMeta: "12 grabaciones - 48 fotos",
    miniMemorial: "Memorial QR",
    miniMemorialMeta: "Listo para compartir",
    miniCta: "Iniciar con el Kit Fundador",

    familiesTitle: "Para Familias",
    familiesBullets: [
      "Preserva lo que mas importa.",
      "Guarda historias, oraciones, recetas, mensajes y recuerdos.",
      "Crea un legado duradero para hijos y generaciones.",
      "Tranquilidad al saber que su voz sigue viva.",
    ],

    funeralTitle: "Para Funerarias",
    funeralBullets: [
      "Ofrece mas. Sirve mejor.",
      "Ofrece paquetes de homenaje digital que las familias valoran.",
      "Enlaces QR, paginas de carga familiar y herramientas para compartir.",
      "Plataforma de marca blanca que fortalece tu marca.",
    ],

    loved: "AMADO POR FAMILIAS",
    testimonials: [
      ["Maria G.", "Austin, TX", "Grabar las historias de mi mama fue un regalo. Mis hijos siempre podran escuchar su voz y conocer su corazon."],
      ["James R.", "Phoenix, AZ", "VozEterna hizo facil capturar el legado de nuestro papa. La pagina con QR acerco a toda la familia."],
      ["Sarah L.", "Directora Funeraria, CA", "Esto agrega valor real. A las familias les encanta tener una forma hermosa de recordar."],
    ],

    bilingualTitle: "Creado para familias en espanol e ingles",
    bilingualText: "Porque el amor y el legado hablan todos los idiomas. Crea, captura y conecta en el idioma que se siente como casa.",
    bilingualSide: "Porque el amor y el legado hablan todos los idiomas.",

    betaTitle: "Aviso de Beta Fundador:",
    betaText: "VozEterna actualmente acepta clientes tempranos. Algunos servicios se entregan manualmente mientras se construye la plataforma completa.",

    pricingEyebrow: "PRECIOS SIMPLES. VALOR DURADERO.",
    viewPrices: "Ver precios en:",
    popular: "MAS POPULAR",
    month: "/mes",
    plans: [
      ["Inicial", "Perfecto para personas que apenas comienzan.", ["Grabaciones guiadas", "Boveda privada (5GB)", "Compartir basico"], "Comenzar"],
      ["Legado Familiar", "Todo lo que tu familia necesita para preservar y compartir.", ["Grabaciones ilimitadas", "Boveda privada (50GB)", "Paginas memoriales con QR", "Planificador de legado"], "Iniciar Mi Legado"],
      ["Aliado Funerario", "Herramientas para servir mejor a mas familias.", ["Paquetes de homenaje digital", "Paginas de carga familiar", "Marca blanca", "Soporte prioritario"], "Ser Aliado"],
    ],

    finalTitle: "No esperes hasta que lo unico que quede sean fotos.",
    finalText: "Captura su voz, su historia y su legado mientras aun puedes.",
    finalCta: "Inicia Tu Legado Hoy",

    footerCompany: "COMPANIA",
    footerSupport: "SOPORTE",
    footerResources: "RECURSOS",
    footerContact: "CONTACTO",
    about: "Acerca de",
    careers: "Carreras",
    press: "Prensa",
    help: "Centro de Ayuda",
    privacy: "Politica de Privacidad",
    terms: "Terminos",
    blog: "Blog",
    guides: "Guias",
    contact: "Contacto",
    location: "Guadalajara, Jalisco, Mexico",
  },
};

function Icon({ type }) {
  if (type === "play") return <svg viewBox="0 0 40 40"><rect x="5" y="8" width="30" height="24" rx="4" /><path d="M17 15l9 5-9 5z" /></svg>;
  if (type === "lock") return <svg viewBox="0 0 40 40"><path d="M12 18h16v14H12z" /><path d="M15 18v-4a5 5 0 0 1 10 0v4" /></svg>;
  if (type === "qr") return <svg viewBox="0 0 40 40"><path d="M8 8h9v9H8zM23 8h9v9h-9zM8 23h9v9H8zM24 24h3v3h-3zM29 29h3v3h-3zM23 31h3v3h-3z" /></svg>;
  return <svg viewBox="0 0 40 40"><path d="M20 31s-11-6.7-11-15a6 6 0 0 1 11-3.3A6 6 0 0 1 31 16c0 8.3-11 15-11 15z" /></svg>;
}

function Cta({ children, href, variant = "primary" }) {
  const safeHref = href || "#pricing";
  const external = safeHref.startsWith("http");
  return (
    <a className={"btn " + variant} href={safeHref} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
      {children}
    </a>
  );
}

function Switchers({ language, setLanguage, currency, setCurrency }) {
  return (
    <div className="siteControls">
      <div className="segmented">
        <button type="button" className={language === "es" ? "active" : ""} onClick={() => setLanguage("es")}>ES</button>
        <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
      </div>
      <div className="segmented">
        <button type="button" className={currency === "USD" ? "active" : ""} onClick={() => setCurrency("USD")}>USD</button>
        <button type="button" className={currency === "MXN" ? "active" : ""} onClick={() => setCurrency("MXN")}>MXN</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [language, setLanguage] = useState("es");
  const [currency, setCurrency] = useState("MXN");
  const t = copy[language];
  const familyForm = FORMS[language].family;
  const funeralForm = FORMS[language].funeral;

  return (
    <main>
      <header>
        <a className="brand" href="#">
          <Image src="/brand/logo-primary.png" alt="VozEterna logo" width={170} height={48} priority />
        </a>

        <nav>
          <a href="#how">{t.navHow}</a>
          <a href="#families">{t.navFamilies}</a>
          <a href="#funeral">{t.navFuneral}</a>
          <a href="#pricing">{t.navPricing}</a>
          <a href="#about">{t.navAbout}</a>
        </nav>

        <div className="headerRight">
          <Switchers language={language} setLanguage={setLanguage} currency={currency} setCurrency={setCurrency} />
          <Cta href={familyForm} variant="gold">{t.start}</Cta>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.heroTitle}</h1>
          <p className="lede">{t.heroText}</p>
          <div className="heroActions">
            <Cta href={familyForm}>{t.primaryCta}</Cta>
            <Cta href="#how" variant="secondary">{t.secondaryCta}</Cta>
          </div>
          <p className="trust">{t.trust}</p>
        </div>

        <div className="heroImage">
          <Image src="/images/hero-family.png" alt="Family recording memories together" fill priority sizes="(max-width: 900px) 100vw, 50vw" />
        </div>
      </section>

      <section className="features">
        {t.features.map(([icon, title, text]) => (
          <article className="feature" key={title}>
            <div className="icon"><Icon type={icon} /></div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="how" id="how">
        <div className="howCopy">
          <p className="sectionLabel">{t.howEyebrow}</p>
          <h2>{t.howTitle}</h2>
          <p>{t.howText}</p>

          <div className="steps">
            {t.steps.map(([title, text], i) => (
              <div className={i === 0 ? "step active" : "step"} key={title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h4>{title}</h4>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="howPreview">
          <div className="previewTop">
            <div>
              <strong>{t.miniTitle}</strong>
              <span>{t.miniSubtitle}</span>
            </div>
            <em>{t.miniPrivate}</em>
          </div>
          <div className="recordingCard">
            <div className="wave">|||</div>
            <h3>{t.miniRecording}</h3>
            <p>{t.miniQuestion}</p>
          </div>
          <div className="previewGrid">
            <div><strong>{t.miniVault}</strong><span>{t.miniVaultMeta}</span></div>
            <div><strong>{t.miniMemorial}</strong><span>{t.miniMemorialMeta}</span></div>
          </div>
          <a className="howMiniCta" href={familyForm} target="_blank" rel="noopener noreferrer">{t.miniCta}</a>
        </div>
      </section>

      <section className="audiences">
        <article className="audience dark" id="families">
          <div>
            <h2>{t.familiesTitle}</h2>
            {t.familiesBullets.map((item) => <p key={item}>{item}</p>)}
          </div>
          <Image src="/images/family-memory.png" alt="Family preserving memories" width={190} height={120} />
        </article>

        <article className="audience light" id="funeral">
          <div>
            <h2>{t.funeralTitle}</h2>
            {t.funeralBullets.map((item) => <p key={item}>{item}</p>)}
          </div>
          <Image src="/images/funeral-dashboard.png" alt="Funeral home dashboard" width={210} height={130} />
        </article>
      </section>

      <section className="quotes">
        <p className="sectionTitle">{t.loved}</p>
        <div>
          {t.testimonials.map(([name, location, quote]) => (
            <article className="quote" key={name}>
              <blockquote>{quote}</blockquote>
              <strong>{name}</strong>
              <span>{location}</span>
            </article>
          ))}
        </div>
      </section>

      
      <section className="bilingual" id="about">
        <div className="bilingualCopy">
          <h2>{t.bilingualTitle}</h2>
          <p>{t.bilingualText}</p>
        </div>

        <div className="bilingualPhoto">
          <img src="/images/bilingual-family.png" alt="Bilingual family using VozEterna" />
        </div>

        <h3>{t.bilingualSide}</h3>
      </section>


      <section className="betaNotice">
        <strong>{t.betaTitle}</strong> {t.betaText}
      </section>

      <section className="section" id="pricing">
        <p className="sectionTitle">{t.pricingEyebrow}</p>

        <div className="pricingControls">
          <span>{t.viewPrices}</span>
          <Switchers language={language} setLanguage={setLanguage} currency={currency} setCurrency={setCurrency} />
        </div>

        <div className="pricing">
          {t.plans.map(([name, description, items, cta], i) => (
            <article className={"priceCard " + (i === 1 ? "popular" : "")} key={name}>
              {i === 1 && <div className="badge">{t.popular}</div>}
              <h3>{name}</h3>
              <p>{description}</p>
              <div className="price"><strong>{prices[currency][i]}</strong><span>{t.month}</span></div>
              <ul>
                {items.map((item) => <li key={item}><span className="checkIcon" aria-hidden="true" />{item}</li>)}
              </ul>
              <Cta href={i === 2 ? funeralForm : familyForm} variant={i === 1 ? "primary" : "secondary"}>{cta}</Cta>
            </article>
          ))}
        </div>
      </section>

      <section className="finalCta">
        <div>
          <span className="infinityIcon" aria-hidden="true" />
          <h2>{t.finalTitle}</h2>
          <p>{t.finalText}</p>
        </div>
        <Image src="/images/old-photo.png" alt="Old family photo being preserved" width={280} height={170} />
        <Cta href={familyForm} variant="gold">{t.finalCta}</Cta>
      </section>

      <footer>
        <a className="brand small" href="#">
          <Image src="/brand/logo-primary.png" alt="VozEterna logo" width={150} height={42} />
        </a>
        <div className="footerCols">
          <div><strong>{t.footerCompany}</strong><a href="/about">{t.about}</a><a href="/careers">{t.careers}</a><a href="/press">{t.press}</a></div>
          <div><strong>{t.footerSupport}</strong><a href="/help-center">{t.help}</a><a href="/privacy-policy">{t.privacy}</a><a href="/terms">{t.terms}</a></div>
          <div><strong>{t.footerResources}</strong><a href="/blog">{t.blog}</a><a href="/guides">{t.guides}</a><a href="/contact">{t.contact}</a></div>
          <div><strong>{t.footerContact}</strong><a href="mailto:felipe.frias.pcs@gmail.com">felipe.frias.pcs@gmail.com</a><a>{t.location}</a></div>
        </div>
      </footer>
    </main>
  );
}

