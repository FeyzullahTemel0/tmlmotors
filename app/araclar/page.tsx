"use client";

import { ArrowRight } from "lucide-react";
import { VehicleCatalog } from "@/components/vehicle-catalog";
import { AdSlot } from "@/components/ad-slot";
import { usePreferences } from "@/lib/i18n/preferences-context";

export default function VehiclesPage() {
  const { t } = usePreferences();

  return (
    <>
      <section className="subpage-hero inventory-hero"><div className="container">
        <span className="eyebrow eyebrow-light">TML MOTORS · GAZİANTEP</span>
        <h1>{t("vehiclesHeroTitle")}</h1>
        <p>{t("vehiclesHeroText")}</p>
      </div></section>
      <section className="listing-section"><div className="container listing-with-aside">
        <div className="listing-main">
          <AdSlot placement="listing-top" />
          <VehicleCatalog />
          <div className="sell-callout"><div><span className="eyebrow">{t("sellCalloutEyebrow")}</span><h2>{t("sellCalloutTitle")}</h2><p>{t("sellCalloutText")}</p></div><a className="button button-primary" href="tel:+905535781136">{t("sellCalloutButton")} <ArrowRight size={16} /></a></div>
        </div>
        <div className="listing-aside"><AdSlot placement="listing-side" /></div>
      </div></section>
    </>
  );
}
