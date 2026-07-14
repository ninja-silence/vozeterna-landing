"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  FolderHeart,
  Globe2,
  Home,
  LibraryBig,
  Menu,
  QrCode,
  Mic2,
  Moon,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  getInitialMobileLanguage,
  setStoredMobileLanguage,
} from "./mobileLanguage";
import { mobileRoutes } from "./mobileRoutes";
import AuthMenuControls from "./AuthMenuControls";

const copy = {
  en: {
    themeDark: "Dark",
    themeLight: "Light",
    menu: "Menu",
    close: "Close",
    back: "Back",
    dashboard: "Home",
    feed: "Feed",
    profile: "Vaults",
    library: "Library",
    collections: "Albums",
    record: "Record",
    upload: "Upload",
    consent: "Consent",
    account: "Account",
    people: "Connected people",
    connect: "Connect",
    website: "Website",
    menuTitle: "VozEterna",
    menuText: "Preserve family memories in one private vault.",
    simpleView: "Simple view",
    fullView: "Full view",
    online: "Online",
    offline: "Offline",
    onlineText: "Ready to save memories",
    offlineText: "You can draft memories and sync later",
  },
  es: {
    themeDark: "Oscuro",
    themeLight: "Claro",
    menu: "Menu",
    close: "Cerrar",
    back: "Atras",
    dashboard: "Inicio",
    feed: "Red",
    profile: "Bovedas",
    library: "Biblioteca",
    collections: "Albumes",
    record: "Grabar",
    upload: "Subir",
    consent: "Consentimiento",
    account: "Cuenta",
    people: "Personas conectadas",
    connect: "Conectar",
    website: "Sitio web",
    menuTitle: "VozEterna",
    menuText: "Preserva recuerdos familiares en una boveda privada.",
    simpleView: "Vista simple",
    fullView: "Vista completa",
    online: "En linea",
    offline: "Sin conexion",
    onlineText: "Listo para guardar recuerdos",
    offlineText: "Puedes crear borradores y sincronizar despues",
  },
};

function getNavItems(t) {
  return [
    { href: mobileRoutes.home, label: t.dashboard, icon: Home },
    { href: mobileRoutes.feed, label: t.feed, icon: Globe2 },
    { href: mobileRoutes.library, label: t.library, icon: LibraryBig },
    { href: mobileRoutes.profiles, label: t.profile, icon: UserRound },
    { href: mobileRoutes.record, label: t.record, icon: Mic2 },
  ];
}

function getMenuItems(t) {
  return [
    { href: mobileRoutes.home, label: t.dashboard, icon: Home },
    { href: mobileRoutes.feed, label: t.feed, icon: Globe2 },
    { href: mobileRoutes.library, label: t.library, icon: LibraryBig },
    { href: mobileRoutes.profiles, label: t.profile, icon: UserRound },
    { href: mobileRoutes.people, label: t.people, icon: UsersRound },
    { href: mobileRoutes.collections, label: t.collections, icon: FolderHeart },
    { href: mobileRoutes.record, label: t.record, icon: Mic2 },
    { href: mobileRoutes.upload, label: t.upload, icon: BookOpen },
    { href: mobileRoutes.consent, label: t.consent, icon: BookOpen },
    { href: mobileRoutes.account, label: t.account, icon: UserRound },
    { href: "/mobile/connect", label: t.connect, icon: QrCode },
    { href: "/", label: t.website, icon: Globe2 },
  ];
}

export default function MobileAppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [simpleView, setSimpleView] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const t = copy[language] || copy.en;
  const navItems = getNavItems(t);
  const menuItems = getMenuItems(t);
  const showBack = pathname !== mobileRoutes.home;

  useEffect(() => {
    const savedTheme = localStorage.getItem("vozeterna-mobile-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }

    const savedSimple = localStorage.getItem("vozeterna-simple-view");
    setSimpleView(savedSimple === "true");

    setLanguage(getInitialMobileLanguage());

    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    function handleLanguageChange(event) {
      if (event.detail === "en" || event.detail === "es") {
        setLanguage(event.detail);
      }
    }

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("vozeterna-language-change", handleLanguageChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("vozeterna-language-change", handleLanguageChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("vozeterna-mobile-theme", nextTheme);
  }

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setStoredMobileLanguage(nextLanguage);
  }

  function toggleSimpleView() {
    const nextValue = !simpleView;
    setSimpleView(nextValue);
    localStorage.setItem("vozeterna-simple-view", String(nextValue));
  }

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(mobileRoutes.home);
  }

  return (
    <div
      className={simpleView ? "mobileAppExperience simpleView" : "mobileAppExperience"}
      data-mobile-theme={theme}
      data-mobile-language={language}
    >
      <header className="mobileNativeHeader">
        <div className="mobileHeaderLeft">
          {showBack && (
            <button type="button" className="mobileBackButton" onClick={goBack}>
              <ArrowLeft size={18} />
              <span>{t.back}</span>
            </button>
          )}

          <Link href={mobileRoutes.home} className="mobileNativeBrand" onClick={() => setMenuOpen(false)}>
            <img src="/brand/logo-emblem.png" alt="VozEterna" />
            <span>VozEterna</span>
          </Link>
        </div>

        <div className="mobileHeaderActions">
          <button type="button" onClick={toggleTheme} className="mobileThemeButton">
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === "dark" ? t.themeLight : t.themeDark}</span>
          </button>

          <button
            type="button"
            className="mobileMenuButton"
            aria-label={menuOpen ? t.close : t.menu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className={isOnline ? "mobileConnectionBar online" : "mobileConnectionBar offline"}>
        <span />
        <strong>{isOnline ? t.online : t.offline}</strong>
        <p>{isOnline ? t.onlineText : t.offlineText}</p>
      </div>

      {menuOpen && (
        <div className="mobileMenuOverlay" role="dialog" aria-modal="true">
          <button className="mobileMenuBackdrop" type="button" onClick={() => setMenuOpen(false)} />

          <aside className="mobileMenuDrawer">
            <div className="mobileMenuDrawerHeader">
              <div>
                <strong>{t.menuTitle}</strong>
                <p>{t.menuText}</p>
              </div>

              <button type="button" onClick={() => setMenuOpen(false)} aria-label={t.close}>
                <X size={18} />
              </button>
            </div>

            <div className="mobileDrawerLanguage">
              <button
                type="button"
                className={language === "en" ? "active" : ""}
                onClick={() => changeLanguage("en")}
              >
                EN
              </button>

              <button
                type="button"
                className={language === "es" ? "active" : ""}
                onClick={() => changeLanguage("es")}
              >
                ES
              </button>
            </div>

            <button type="button" className="mobileSimpleToggle" onClick={toggleSimpleView}>
              {simpleView ? t.fullView : t.simpleView}
            </button>

            <nav className="mobileDrawerLinks">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <AuthMenuControls
              language={language}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="mobileNativeContent">{children}</div>

      <nav className="mobileNativeBottomNav premiumBottomNav" aria-label="Mobile app navigation">
        {navItems.map((item) => {
          const active =
            item.href === mobileRoutes.home
              ? pathname === mobileRoutes.home
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link href={item.href} className={active ? "active" : ""} key={item.href}>
              <span className="premiumNavIconWrap">
                <Icon size={21} strokeWidth={2.35} />
              </span>
              <strong>{item.label}</strong>
              <em />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
