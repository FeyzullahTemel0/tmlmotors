"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdSlot } from "@/components/ad-slot";
import { MobileTabBar } from "@/components/mobile-tab-bar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return <main>{children}</main>;

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <div className="container ad-band ad-band-footer"><AdSlot placement="footer-strip" /></div>
      <SiteFooter />
      <MobileTabBar />
    </>
  );
}
