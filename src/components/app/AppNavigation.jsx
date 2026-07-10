"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/loved-ones", label: "Profiles" },
  { href: "/app/library", label: "Library" },
  { href: "/app/record", label: "Record" },
  { href: "/app/upload", label: "Upload" },
  { href: "/app/account", label: "Account" },
];

export default function AppNavigation() {
  const pathname = usePathname();

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
            <Link
              key={link.href}
              href={link.href}
              className={active ? "active" : ""}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}