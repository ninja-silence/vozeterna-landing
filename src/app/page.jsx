import Image from "next/image";

const features = [
  { icon: "play", title: "Guided Video & Audio Recording", text: "Easy step-by-step prompts help capture life stories, values, prayers, recipes, and final messages." },
  { icon: "lock", title: "Private Family Vault", text: "Securely store and organize memories only your family can access." },
  { icon: "qr", title: "QR Memorial Pages", text: "Beautiful tribute pages to share stories and keep their memory alive." },
  { icon: "heart", title: "Social Legacy Planner", text: "Plan wishes for social accounts, assets, and special instructions." },
];

const steps = [
  ["1", "Record", "Capture stories, voice messages, photos, and legacy wishes with guided tools."],
  ["2", "Preserve", "Store everything in a private family vault for future generations."],
  ["3", "Share", "Share memories through QR pages, family invites, or when the time is right."],
];

const testimonials = [
  ["Maria G.", "Austin, TX", "Recording my mom's stories was such a gift. My kids will always hear her voice and know her heart."],
  ["James R.", "Phoenix, AZ", "VozEterna made it easy to capture our dad's legacy. The QR page brought our family together."],
  ["Sarah L.", "Funeral Director, CA", "This adds real value. Families love having a beautiful way to remember."],
];

const plans = [
  ["Starter", "$9", "Perfect for individuals getting started.", ["Guided recordings", "Private vault (5GB)", "Basic sharing"], "Get Started"],
  ["Family Legacy", "$19", "Everything your family needs to preserve and share.", ["Unlimited recordings", "Private vault (50GB)", "QR memorial pages", "Legacy planner"], "Start Your Legacy"],
  ["Funeral Home Partner", "$49", "Powerful tools to serve more families.", ["Digital tribute packages", "Family upload pages", "White-label branding", "Priority support"], "Partner With Us"],
];

function Icon({ type }: { type: string }) {
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
          <a href="#how">How It Works</a>
          <a href="#families">For Families</a>
          <a href="#funeral-homes">For Funeral Homes</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </nav>
        <Cta variant="gold">Start a Legacy</Cta>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">Bilingual legacy & memorial platform</p>
          <h1>Record their voice. Preserve their story.</h1>
                    <p className="lede">
            VozEterna helps families save video, audio, photos, final messages, and social legacy wishes - before it is too late.
          </p>
          <div className="actions">
            <Cta>Create a Family Legacy</Cta>
            <Cta href="#how" variant="secondary">See How It Works</Cta>
          </div>
          <p className="trust">Private by default - English and Spanish - QR memorial ready</p>
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
          <p className="eyebrow">How It Works</p>
          <h2>Three simple steps to preserve a voice forever.</h2>
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
                <h3>Record</h3>
                <p>
                  Invite a loved one to answer guided prompts by video or audio.
                  Capture stories, prayers, advice, recipes, and final messages.
                </p>
              </div>
            </article>

            <article className="howStep">
              <span>02</span>
              <div>
                <h3>Preserve</h3>
                <p>
                  Store recordings, photos, notes, and social legacy wishes inside
                  a private family vault with simple permissions.
                </p>
              </div>
            </article>

            <article className="howStep">
              <span>03</span>
              <div>
                <h3>Share</h3>
                <p>
                  Create a beautiful QR memorial page that can be shared with family,
                  printed on programs, or used by funeral-home partners.
                </p>
              </div>
            </article>

            <article className="howStep">
              <span>04</span>
              <div>
                <h3>Keep Their Legacy Alive</h3>
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
                <small>Family Legacy Flow</small>
              </div>
              <span>Private</span>
            </div>

            <div className="phoneMock">
              <div className="recordingPulse">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <h4>Recording Memory</h4>
              <p>"What do you want your grandchildren to remember?"</p>
            </div>

            <div className="flowCards">
              <div>
                <b>Private Vault</b>
                <small>12 recordings - 48 photos</small>
              </div>
              <div>
                <b>QR Memorial</b>
                <small>Ready to share</small>
              </div>
            </div>

            <a className="howMiniCta" href="https://tally.so/r/Xxy6pP" target="_blank" rel="noopener noreferrer">Start with the Founder Kit</a>
          </div>
        </div>
      </section>

      <section className="audience">
        <article id="families" className="audiencePanel dark">
          <div>
            <h2>For Families</h2>
            <p>Preserve what matters most.</p>
            <ul>
              <li>Save stories, prayers, recipes, messages, and memories.</li>
              <li>Create a lasting legacy for children and generations.</li>
              <li>Peace of mind knowing their voice lives on.</li>
            </ul>
          </div>
          <Image src="/images/family-memory.png" alt="" width={420} height={260} />
        </article>
        <article id="funeral-homes" className="audiencePanel light">
          <div>
            <h2>For Funeral Homes</h2>
            <p>Offer more. Serve better.</p>
            <ul>
              <li>Offer digital tribute packages families love.</li>
              <li>QR links, family upload pages, and sharing tools.</li>
              <li>White-label platform that strengthens your brand.</li>
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
          <h2>Built for families in English & Spanish</h2>
          <p>Because love and legacy speak every language. Create, capture, and connect in the language that feels like home.</p>
        </div>
        <Image src="/images/bilingual-family.png" alt="" width={340} height={210} />
        <p className="spanish">Porque el amor y el legado hablan todos los idiomas.</p>
      </section>

            <section className="betaNotice">
        <strong>Founder Beta Notice:</strong>
        VozEterna is currently accepting early customers. Some services are delivered manually while the full platform is being built.
      </section>

      <section className="section" id="pricing">
        <div className="sectionTitle">Simple pricing. Lasting value.</div>
        <div className="pricing">
          {plans.map(([name, price, description, items, cta], i) => (
            <article className={`priceCard ${i === 1 ? "popular" : ""}`} key={name as string}>
              {i === 1 && <div className="badge">Most popular</div>}
              <h3>{name}</h3>
              <p>{description}</p>
              <div className="price">{price}<span>/mo</span></div>
              <ul>{items.map(item => <li key={item}><span className="checkIcon" aria-hidden="true" />{item}</li>)}</ul>
              <Cta href={i === 2 ? "https://tally.so/r/rjW8X2" : "https://tally.so/r/Xxy6pP"} variant={i === 1 ? "primary" : "secondary"}>{cta}</Cta>
            </article>
          ))}
        </div>
      </section>

            <section className="finalCta">
        <div>
          <span className="infinityIcon" aria-hidden="true" />
          <h2>Do not wait until all you have left is photos.</h2>
          <p>Capture their voice, their story, and their legacy while you still can.</p>
        </div>
        <Image src="/images/old-photo.png" alt="Old family photo being preserved" width={280} height={170} />
        <Cta variant="gold">Start Your Legacy Today</Cta>
      </section>

      <footer>
        <Logo />
        <div className="footerCols">
          <div><b>Company</b><a>About Us</a><a>Careers</a><a>Press</a></div>
          <div><b>Support</b><a>Help Center</a><a>Privacy Policy</a><a>Terms</a></div>
          <div><b>Resources</b><a>Blog</a><a>Guides</a><a>Contact</a></div>
          <div><b>Contact</b><a>hello@vozeterna.com</a><a>Austin, Texas</a></div>
        </div>
      </footer>
    </main>
  );
}
