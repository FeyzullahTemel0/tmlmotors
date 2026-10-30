"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, CircleUserRound, FileText, Home } from "lucide-react";
import { usePreferences } from "@/lib/i18n/preferences-context";
import type { TranslationKey } from "@/lib/i18n/translations";

const items: { href: string; key: TranslationKey; icon: typeof Home; exact: boolean }[] = [
  { href: "/", key: "home", icon: Home, exact: true },
  { href: "/araclar", key: "tabVehicles", icon: Car, exact: false },
  { href: "/blog", key: "tabBlog", icon: FileText, exact: false },
  { href: "/profil", key: "tabProfile", icon: CircleUserRound, exact: false },
];

export function MobileTabBar() {
  const pathname = usePathname() ?? "";
  const { t } = usePreferences();
  // Araç detayında sabit arama çubuğu altta olduğu için çakışmayı önle.
  if (/^\/araclar\/.+/.test(pathname)) return null;

  return (
    <nav className="mobile-tab-bar" aria-label="Hızlı gezinme">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>
            <item.icon size={20} strokeWidth={1.8} />
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
