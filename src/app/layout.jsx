import "./globals.css";

export const metadata = {
  title: "VozEterna | Preserve Your Voice for Future Generations",
  description:
    "VozEterna helps families preserve real voices, stories, photos, videos, final messages, and memories in a private bilingual legacy vault for future generations.",
  keywords: [
    "digital legacy",
    "family memories",
    "voice archive",
    "memorial QR",
    "legacy vault",
    "bilingual family platform",
    "VozEterna",
  ],
  metadataBase: new URL("https://vozeterna-landing-d6sa.vercel.app"),
  openGraph: {
    title: "VozEterna | Preserve Your Voice for Future Generations",
    description:
      "Create a private bilingual legacy vault of voices, stories, photos, videos, and final messages for your family.",
    url: "https://vozeterna-landing-d6sa.vercel.app",
    siteName: "VozEterna",
    images: [
      {
        url: "/brand/logo-primary.png",
        width: 1200,
        height: 630,
        alt: "VozEterna digital legacy platform",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VozEterna | Preserve Your Voice for Future Generations",
    description:
      "A private bilingual legacy vault for voices, stories, photos, videos, and final messages.",
    images: ["/brand/logo-primary.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX">
      <body>
        <a className="skip-link" href="#main-content">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}