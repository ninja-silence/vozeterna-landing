"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/mobile", label: "Dashboard", icon: "▤" },
  { href: "/mobile/profiles", label: "Profile", icon: "●" },
  { href: "/mobile/library", label: "Library", icon: "▰" },
  { href: "/mobile/collections", label: "Collections", icon: "⌂" },
  { href: "/mobile/record", label: "Record", icon: "◔" },
];

export default function MobileAppShell({ children }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("vozeterna-mobile-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("vozeterna-mobile-theme", nextTheme);
  }

  return (
    <div className="mobileAppExperience" data-mobile-theme={theme}>
      <header className="mobileNativeHeader">
        <Link href="/mobile" className="mobileNativeBrand">
          <img src="/brand/logo-emblem.png" alt="VozEterna" />
          <span>VozEterna</span>
        </Link>

        <div className="mobileHeaderActions">
          <button type="button" onClick={toggleTheme} className="mobileThemeButton">
            {theme === "dark" ? "Light" : "Dark"}
          </button>

          <button type="button" className="mobileMenuButton" aria-label="Menu">
            ☰
          </button>
        </div>
      </header>

      <div className="mobileNativeContent">
        {children}
      </div>

      <nav className="mobileNativeBottomNav" aria-label="Mobile app navigation">
        {navItems.map((item) => {
          const active =
            item.href === "/mobile"
              ? pathname === "/mobile"
              : pathname.startsWith(item.href);

          return (
            <Link href={item.href} className={active ? "active" : ""} key={item.href}>
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}