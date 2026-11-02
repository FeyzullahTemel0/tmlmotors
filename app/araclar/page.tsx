"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { VehicleCatalog } from "@/components/vehicle-catalog";
import { AdSlot } from "@/components/ad-slot";
import { usePreferences } from "@/lib/i18n/preferences-context";

export default function VehiclesPage() {
  const { t } = usePreferences();

  return (
    <>
      <section className="subpage-hero inventory-hero hero-hide-mobile"><div className="container">
        <span className="eyebrow eyebrow-light">TML MOTORS · GAZİANTEP</span>
        <h1>{t("vehiclesHeroTitle")}</h1>
        <p>{t("vehiclesHeroText")}</p>
      </div></section>
      <section className="listing-section"><div className="container listing-with-aside">
        <div className="listing-main">
          <AdSlot placement="listing-top" />
          <VehicleCatalog />
          <div className="sell-callout"><div><span className="eyebrow">{t("sellCalloutEyebrow")}</span><h2>{t("sellCalloutTitle")}</h2><p>{t("sellCalloutText")}</p></div><Link className="button button-primary" href="/aracimi-sat">{t("sellCalloutButton")} <ArrowRight size={16} /></Link></div>
          <p className="damaged-note">Hasar kayıtlı araçlar ayrı bir sayfada, açık hasar bilgisiyle listelenir. <Link href="/hasarli-araclar">Hasarlı araçları incele <ArrowRight size={13} /></Link></p>
        </div>
        <div className="listing-aside"><AdSlot placement="listing-side" /></div>
      </div></section>
    </>
  );
}
