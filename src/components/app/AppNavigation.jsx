"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredAppLanguage } from "../../lib/appLanguage";

const navCopy = {
  en: [
    { href: "/app", label: "Dashboard" },
    { href: "/app/loved-ones", label: "Profiles" },
    { href: "/app/library", label: "Library" },
    { href: "/app/collections", label: "Collections" },
    { href: "/app/record", label: "Record" },
    { href: "/app/upload", label: "Upload" },
    { href: "/app/account", label: "Account" },
  ],
  es: [
    { href: "/app", label: "Inicio" },
    { href: "/app/loved-ones", label: "Perfiles" },
    { href: "/app/library", label: "Biblioteca" },
    { href: "/app/collections", label: "Álbumes" },
    { href: "/app/record", label: "Grabar" },
    { href: "/app/upload", label: "Subir" },
    { href: "/app/account", label: "Cuenta" },
  ],
};

export default function AppNavigation() {
  const pathname = usePathname();
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    setLanguage(getStoredAppLanguage());

    function handleLanguageChange(event) {
      setLanguage(event.detail?.language || getStoredAppLanguage());
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("vozeterna-language-change", handleLanguageChange);
    };
  }, []);

  const links = navCopy[language] || navCopy.en;

  return (
    <nav className="appNav">
      <Link href="/" className="appNavBrand">
        VozEterna
      </Link>

      <div className="appNavLinks">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/app" && pathname.startsWith(link.href));

          return (
            <Link key={link.href} href={link.href} className={active ? "active" : ""}>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}