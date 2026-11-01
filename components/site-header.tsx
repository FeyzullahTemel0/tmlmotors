"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";
import { useAuthStatus } from "@/lib/use-auth-status";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { usePreferences } from "@/lib/i18n/preferences-context";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const auth = useAuthStatus();
  const { t } = usePreferences();

  return (
    <header className="site-header">
      <div className="topline">
        <div className="container topline-inner">
          <span>GAZİANTEP · GÜNSEV OTO AVM</span>
          <span>{t("licenseNo")}: 2701072</span>
        </div>
      </div>
      <div className="container nav-wrap">
        <Link className="brand" href="/" aria-label="TML MOTORS ana sayfa">
          <Image
            src="/tml-motors-logo.png"
            alt="TML MOTOR'S"
            width={129}
            height={48}
            priority
            className="site-logo"
          />
        </Link>
        <NotificationBell />
        <button
          className="mobile-menu-button"
          type="button"
          aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"}>
          <Link className="nav-home-link" href="/" onClick={() => setMenuOpen(false)}>{t("home")}</Link>
          <Link href="/araclar" onClick={() => setMenuOpen(false)}>{t("buySell")}</Link>
          <Link href="/hasarli-araclar" onClick={() => setMenuOpen(false)}>{t("navDamaged")}</Link>
          <Link href="/galericiler" onClick={() => setMenuOpen(false)}>{t("navDealers")}</Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)}>{t("blog")}</Link>
          <Link href="/iletisim" onClick={() => setMenuOpen(false)}>{t("contact")}</Link>
          {auth.signedIn
            ? <Link href="/profil" onClick={() => setMenuOpen(false)}>{t("profile")}</Link>
            : <Link href="/giris" onClick={() => setMenuOpen(false)}>{t("signIn")}</Link>}
          <LanguageSwitcher />
          <Link className="nav-contact" href="/aracimi-sat" onClick={() => setMenuOpen(false)}>
            {t("navSell")} <ArrowRight size={14} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
