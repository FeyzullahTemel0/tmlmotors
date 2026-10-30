"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight, Facebook, Instagram, Youtube } from "lucide-react";
import { usePreferences } from "@/lib/i18n/preferences-context";

type PublicLinks = {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  arabam?: string;
  sahibinden?: string;
};

export function SiteFooter() {
  const [links, setLinks] = useState<PublicLinks>({ sahibinden: "https://tmlmotors.sahibinden.com" });
  const { t } = usePreferences();

  useEffect(() => {
    let mounted = true;
    void fetch("/api/site-settings", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Site bağlantıları yüklenemedi.");
      if (mounted) setLinks({ sahibinden: "https://tmlmotors.sahibinden.com", ...result.links });
    }).catch((error: unknown) => console.error("Site bağlantıları yüklenemedi:", error));
    return () => { mounted = false; };
  }, []);

  return (
    <footer className="site-footer" id="iletisim">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link className="brand brand-light" href="/" aria-label="TML MOTORS ana sayfa">
            <Image src="/tml-motors-logo.png" alt="TML MOTORS" width={129} height={48} className="site-logo" />
          </Link>
          <p>{t("footerTagline")}</p>
          <div className="social-links" aria-label="Sosyal medya bağlantıları">
            {links.instagram ? <a href={links.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={15} /></a> : null}
            {links.facebook ? <a href={links.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={15} /></a> : null}
            {links.youtube ? <a href={links.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={15} /></a> : null}
          </div>
        </div>
        <div className="footer-col">
          <h3>TML MOTORS</h3>
          <Link href="/araclar">{t("footerConsulting")}</Link>
          <Link href="/blog">{t("footerGuide")}</Link>
          <Link href="/iletisim">{t("contact")}</Link>
          {links.sahibinden ? <a href={links.sahibinden} target="_blank" rel="noreferrer">{t("footerListings")} <ArrowUpRight size={14} /></a> : null}
          {links.arabam ? <a href={links.arabam} target="_blank" rel="noreferrer">{t("footerArabam")} <ArrowUpRight size={14} /></a> : null}
        </div>
        <div className="footer-col">
          <h3>{t("footerContact")}</h3>
          <a href="tel:+905535781136">+90 553 578 11 36</a>
          <span>Günsev Oto AVM, Gaziantep</span>
          <span>{t("licenseLabel")}: 2701072</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} TML MOTORS. {t("footerRights")}</span>
        <span>{t("ownerLabel")}: Muhammed Emin TEMEL</span>
      </div>
    </footer>
  );
}
