import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { JsonLd } from "@/components/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { PreferencesProvider } from "@/lib/i18n/preferences-context";
import { VehicleCollectionsProvider } from "@/lib/vehicle-collections";
import "./globals.css";
import "./modern.css";
import "./admin.css";
import "./ads.css";
import "./blog.css";
import "./home.css";
import "./profile.css";
import "./features.css";
import "./palette.css";
import "./admin-map.css";

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
  const siteUrl = getSiteUrl();
  return (
    <html lang="tr">
      <body>
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "AutoDealer",
          name: "TML MOTORS",
          url: siteUrl,
          telephone: "+905535781136",
          description: "Gaziantep Günsev Oto AVM'de araç alım satım danışmanlığı.",
          identifier: "Yetki Belge No: 2701072",
          address: { "@type": "PostalAddress", streetAddress: "Karacaahmet Mah. 38087 Nolu Cd. Günsev Oto AVM No:5 İç Kapı No:139", addressLocality: "Şehitkamil", addressRegion: "Gaziantep", postalCode: "27000", addressCountry: "TR" },
          sameAs: ["https://tmlmotors.sahibinden.com"],
        }} />
        <PreferencesProvider>
          <VehicleCollectionsProvider>
            <SiteShell>{children}</SiteShell>
          </VehicleCollectionsProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
