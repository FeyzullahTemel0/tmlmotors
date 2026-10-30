import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { getSiteUrl } from "@/lib/site-url";
import { PreferencesProvider } from "@/lib/i18n/preferences-context";
import "./globals.css";
import "./modern.css";
import "./admin.css";
import "./ads.css";
import "./blog.css";
import "./home.css";

export const metadata: Metadata = {
  title: {
    default: "TML MOTORS | Gaziantep Araç Alım Satım Danışmanlığı",
    template: "%s | TML MOTORS",
  },
  description:
    "Gaziantep Günsev Oto AVM'de TML MOTORS. Araç alım ve satım sürecinizde açık iletişim ve danışmanlık. Güncel ilanlarımız sahibinden.com profilimizde.",
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: "TML MOTORS | Aracınızı Alırken de Satarken de Yanınızda",
    description:
      "Gaziantep'te araç alım ve satım danışmanlığı. Önce konuşalım, süreci birlikte değerlendirelim.",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <PreferencesProvider>
          <SiteShell>{children}</SiteShell>
        </PreferencesProvider>
      </body>
    </html>
  );
}
