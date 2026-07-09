import Image from "next/image";

const features = [
  { icon: "play", title: "Grabacion Guiada en Video y Audio", text: "Preguntas faciles paso a paso para capturar historias de vida, valores, oraciones, recetas y mensajes finales." },
  { icon: "lock", title: "Boveda Familiar Privada", text: "Guarda y organiza recuerdos importantes con acceso seguro solo para tu familia." },
  { icon: "qr", title: "Paginas Memoriales con QR", text: "Hermosas paginas de homenaje para compartir historias y mantener viva la memoria." },
  { icon: "heart", title: "Planificador de Legado Social", text: "Planea deseos para cuentas sociales, bienes, instrucciones especiales y recuerdos digitales." },
];

const steps = [
  ["1", "Grabar", "Capture stories, voice messages, photos, and legacy wishes with guided tools."],
  ["2", "Preservar", "Store everything in a private family vault for future generations."],
  ["3", "Compartir", "Compartir memories through QR pages, family invites, or when the time is right."],
];

const testimonials = [
  ["Maria G.", "Austin, TX", "Grabar las historias de mi mama fue un regalo. Mis hijos siempre podran escuchar su voz y conocer su corazon."],
  ["James R.", "Phoenix, AZ", "VozEterna hizo facil capturar el legado de nuestro papa. La pagina con QR acerco a toda la familia."],
  ["Sarah L.", "Directora Funeraria, CA", "Esto agrega valor real. A las familias les encanta tener una forma hermosa de recordar."],
];

const plans = [
  ["Inicial", "$159 MXN", "Perfecto para personas que apenas comienzan.", ["Grabaciones guiadas", "Boveda privada (5GB)", "Compartir basico"], "Comenzar"],
  ["Legado Familiar", "$349 MXN", "Todo lo que tu familia necesita para preservar y compartir.", ["Grabaciones ilimitadas", "Boveda privada (50GB)", "Paginas memoriales con QR", "Planificador de legado"], "Iniciar Mi Legado"],
  ["Aliado Funerario", "$899 MXN", "Herramientas para servir mejor a mas familias.", ["Paquetes de homenaje digital", "Paginas de carga familiar", "Marca blanca", "Soporte prioritario"], "Ser Aliado"],
];

function Icon({ type }) {
  if (type === "play") return <svg viewBox="0 0 40 40"><rect x="5" y="8" width="30" height="24" rx="6"/><path d="M18 15l10 5-10 5z"/></svg>;
  if (type === "lock") return <svg viewBox="0 0 40 40"><path d="M12 18h16v14H12z"/><path d="M15 18v-4a5 5 0 0110 0v4"/><circle cx="20" cy="25" r="2"/></svg>;
  if (type === "qr") return <svg viewBox="0 0 40 40"><path d="M8 8h9v9H8zM23 8h9v9h-9zM8 23h9v9H8zM24 24h3v3h-3zM29 23h3v9h-3zM22 29h4v3h-4z"/></svg>;
  return <svg viewBox="0 0 40 40"><path d="M20 31s-12-7.2-12-15a6.5 6.5 0 0111.6-4A6.5 6.5 0 0132 16c0 7.8-12 15-12 15z"/></svg>;
}

function Logo() {
  return (
    <a href="#" className="logo" aria-label="VozEterna home">
      <Image src="/brand/logo-emblem.png" alt="" width={92} height={40} priority className="logoEmblem" />
      <span className="wordmark">VozEterna</span>
    </a>
  );
}

function Cta({ children, href = "#pricing", variant = "primary" }) {
  return <a className={`btn ${variant}`} href={href}>{children}</a>;
}

export default function Home() {
  return (
    <main>
      <header className="nav">
        <Logo />
        <nav>
          <a href="#how">Como Funciona</a>
          <a href="#families">Para Familias</a>
          <a href="#funeral-homes">Para Funerarias</a>
          <a href="#pricing">Precios</a>
          <a href="#about">Acerca de</a>
        </nav>
        <Cta variant="gold">Iniciar un Legado</Cta>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">Bilingual legacy & memorial platform</p>
          <h1>Graba su voz. Conserva su historia.</h1>
                    <p className="lede">
            VozEterna ayuda a las familias a guardar videos, audio, fotos, mensajes finales y deseos de legado digital antes de que sea demasiado tarde.
          </p>
          <div className="actions">
            <Cta>Crear un Legado Familiar</Cta>
            <Cta href="#how" variant="secondary">See Como Funciona</Cta>
          </div>
          <p className="trust">Privado por defecto - Espanol e ingles - Memorial con QR listo</p>
        </div>

        <div className="heroMedia">
          <Image src="/images/hero-family.png" alt="Family recording memories together" fill priority sizes="(max-width: 900px) 100vw, 50vw" />
        </div>
      </section>

      <section className="featureGrid">
        {features.map((feature) => (
          <article className="card feature" key={feature.title}>
            <div className="icon"><Icon type={feature.icon} /></div>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>

                  <section className="howSection" id="how">
        <div className="howHeader">
          <p className="eyebrow">Como Funciona</p>
          <h2>Tres pasos sencillos para preservar una voz para siempre.</h2>
          <p>
            VozEterna guides families through recording, organizing, and sharing memories
            in a secure legacy experience built for real people, not complicated software.
          </p>
        </div>

        <div className="howLayout">
          <div className="howSteps">
            <article className="howStep active">
              <span>01</span>
              <div>
                <h3>Grabar</h3>
                <p>
                  Invite a loved one to answer guided prompts by video or audio.
                  Capture stories, prayers, advice, recipes, and final messages.
                </p>
              </div>
            </article>

            <article className="howStep">
              <span>02</span>
              <div>
                <h3>Preservar</h3>
                <p>
                  Store recordings, photos, notes, and social legacy wishes inside
                  a private family vault with simple permissions.
                </p>
              </div>
            </article>

            <article className="howStep">
              <span>03</span>
              <div>
                <h3>Compartir</h3>
                <p>
                  Create a beautiful QR memorial page that can be shared with family,
                  printed on programs, or used by funeral-home partners.
                </p>
              </div>
            </article>

            <article className="howStep">
              <span>04</span>
              <div>
                <h3>Mantener Vivo Su Legado</h3>
                <p>
                  Families can continue adding memories, guestbook messages, photos,
                  and tributes over time.
                </p>
              </div>
            </article>
          </div>

          <div className="howPreview" aria-label="VozEterna product flow preview">
            <div className="previewTop">
              <div>
                <b>VozEterna</b>
                <small>Flujo de Legado Familiar</small>
              </div>
              <span>Private</span>
            </div>

            <div className="phoneMock">
              <div className="recordingPulse">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <h4>Grabaring Memory</h4>
              <p>"Que quieres que recuerden tus nietos?"</p>
            </div>

            <div className="flowCards">
              <div>
                <b>Boveda Privada</b>
                <small>12 grabaciones - 48 fotos</small>
              </div>
              <div>
                <b>Memorial QR</b>
                <small>Listo para compartir</small>
              </div>
            </div>

            <a className="howMiniCta" href="https://tally.so/r/Xxy6pP" target="_blank" rel="noopener noreferrer">Iniciar con el Kit Fundador</a>
          </div>
        </div>
      </section>

      <section className="audience">
        <article id="families" className="audiencePanel dark">
          <div>
            <h2>Para Familias</h2>
            <p>Preservar what matters most.</p>
            <ul>
              <li>Guarda historias, oraciones, recetas, mensajes y recuerdos.</li>
              <li>Crea un legado duradero para hijos y generaciones.</li>
              <li>Tranquilidad al saber que su voz sigue viva.</li>
            </ul>
          </div>
          <Image src="/images/family-memory.png" alt="" width={420} height={260} />
        </article>
        <article id="funeral-homes" className="audiencePanel light">
          <div>
            <h2>Para Funerarias</h2>
            <p>Ofrece mas. Sirve mejor.</p>
            <ul>
              <li>Ofrece paquetes de homenaje digital que las familias valoran.</li>
              <li>Enlaces QR, paginas de carga familiar y herramientas para compartir.</li>
              <li>Plataforma de marca blanca que fortalece tu marca.</li>
            </ul>
          </div>
          <Image src="/images/funeral-dashboard.png" alt="" width={420} height={260} />
        </article>
      </section>

      <section className="section">
        <div className="sectionTitle">Loved by families</div>
        <div className="testimonials">
          {testimonials.map(([name, location, quote]) => (
            <figure className="card quote" key={name}>
              <blockquote>{quote}</blockquote>
              <figcaption><b>{name}</b><span>{location}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bilingual" id="about">
        <div className="languageBadge"><span>EN</span><span>ES</span></div>
        <div>
          <h2>Creado para familias en espanol e ingles</h2>
          <p>Porque el amor y el legado hablan todos los idiomas. Crea, captura y conecta en el idioma que se siente como casa.</p>
        </div>
        <Image src="/images/bilingual-family.png" alt="" width={340} height={210} />
        <p className="spanish">Porque el amor y el legado hablan todos los idiomas.</p>
      </section>

            <section className="betaNotice">
        <strong>Aviso de Beta Fundador:</strong>
        VozEterna actualmente acepta clientes tempranos. Algunos servicios se entregan manualmente mientras se construye la plataforma completa.
      </section>

      <section className="section" id="pricing">
        <div className="sectionTitle">Simple pricing. Lasting value.</div>
        <div className="pricing">
          {plans.map(([name, price, description, items, cta], i) => (
            <article className={`priceCard ${i === 1 ? "popular" : ""}`} key={name}>
              {i === 1 && <div className="badge">Mas popular</div>}
              <h3>{name}</h3>
              <p>{description}</p>
              <div className="price">{price}<span>/mes</span></div>
              <ul>{items.map(item => <li key={item}><span className="checkIcon" aria-hidden="true" />{item}</li>)}</ul>
              <Cta href={i === 2 ? "https://tally.so/r/rjW8X2" : "https://tally.so/r/Xxy6pP"} variant={i === 1 ? "primary" : "secondary"}>{cta}</Cta>
            </article>
          ))}
        </div>
      </section>

            <section className="finalCta">
        <div>
          <span className="infinityIcon" aria-hidden="true" />
          <h2>No esperes hasta que lo unico que quede sean fotos.</h2>
          <p>Captura su voz, su historia y su legado mientras aun puedes.</p>
        </div>
        <Image src="/images/old-photo.png" alt="Old family photo being preserved" width={280} height={170} />
        <Cta variant="gold">Inicia Tu Legado Hoy</Cta>
      </section>

      <footer>
        <Logo />
        <div className="footerCols">
          <div><b>Company</b><a>Acerca de Us</a><a>Carreras</a><a>Prensa</a></div>
          <div><b>Support</b><a>Centro de Ayuda</a><a>Politica de Privacidad</a><a>Terminos</a></div>
          <div><b>Resources</b><a>Blog</a><a>Guias</a><a>Contacto</a></div>
          <div><b>Contacto</b><a>hello@vozeterna.com</a><a>Austin, Texas</a></div>
        </div>
      </footer>
    </main>
  );
}
