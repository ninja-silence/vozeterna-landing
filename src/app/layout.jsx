import "./globals.css";

export const metadata = {
  title: "VozEterna — Record their voice. Preserve their story.",
  description:
    "A bilingual family legacy and memorial platform for recording video, audio, photos, final messages, QR memorial pages, and social legacy wishes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
