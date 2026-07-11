"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppLanguage } from "../../lib/useAppLanguage";

const copy = {
  en: {
    dashboard: "Dashboard",
    profiles: "Profiles",
    library: "Library",
    collections: "Collections",
    record: "Record",
    upload: "Upload",
    account: "Account",
  },
  es: {
    dashboard: "Inicio",
    profiles: "Perfiles",
    library: "Biblioteca",
    collections: "Álbumes",
    record: "Grabar",
    upload: "Subir",
    account: "Cuenta",
  },
};

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const language = useAppLanguage();
  const t = copy[language] || copy.en;

  const links = [
    { href: "/app", label: t.dashboard },
    { href: "/app/loved-ones", label: t.profiles },
    { href: "/app/library", label: t.library },
    { href: "/app/collections", label: t.collections },
    { href: "/app/record", label: t.record },
    { href: "/app/upload", label: t.upload },
    { href: "/app/account", label: t.account },
  ];

  function isActive(href) {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="appHeader">
        <Link href="/app" className="appLogo">
          VozEterna
        </Link>

        <nav className="appNav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="appContent">
        {children}
      </div>
    </>
  );
}