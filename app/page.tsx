"use client";

import Link from "next/link";
import { ArrowRight, CarFront, Handshake, MapPin, MessageCircle, Navigation, Phone, Scale, ShieldCheck } from "lucide-react";
import { VehicleCatalog } from "@/components/vehicle-catalog";
import { AdSlot } from "@/components/ad-slot";
import { LatestJournal } from "@/components/latest-journal";
import { HomeTrust } from "@/components/home-trust";
import { usePreferences } from "@/lib/i18n/preferences-context";

const phone = "+905535781136";
const mapsUrl = "https://www.google.com/maps/search/?api=1&query=G%C3%BCnsev+Oto+AVM+Gaziantep";

export default function HomePage() {
  const { t } = usePreferences();

  return (
    <>
      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-backdrop" src="/hero-porsche.gif" alt="" aria-hidden="true" />
        <div className="container hero-layout">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light"><MapPin size={14} /> GAZİANTEP · GÜNSEV OTO AVM</span>
            <h1>{t("heroTitleA")} <em>{t("heroTitleB")}</em></h1>
            <p>{t("heroText")}</p>
            <div className="hero-actions">
              <a className="button button-primary" href={`tel:${phone}`}>{t("heroCall")} <Phone size={16} /></a>
              <a className="hero-secondary-link" href="#hizmetler">{t("heroSecondary")} <ArrowRight size={15} /></a>
            </div>
          </div>
          <div className="hero-visual" aria-label="TML MOTORS">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hero-visual-image" src="/hero-porsche.gif" alt="TML MOTORS" />
            <div className="hero-visual-overlay" />
            <div className="hero-visual-mark"><span>TML MOTORS</span><i /> <span>GAZİANTEP</span></div>
            <div className="hero-visual-caption"><span>{t("heroCaptionTags")}</span><b>{t("heroCaptionBold")}</b></div>
            <span className="hero-visual-number">GÜNSEV OTO AVM</span>
          </div>
          <div className="hero-bottom"><span>{t("heroBottomLine")}</span><a href={`tel:${phone}`}><Phone size={14} /> +90 553 578 11 36</a></div>
        </div>
      </section>

      <section className="intro-strip" aria-label="TML MOTORS">
        <div className="container intro-strip-inner">
          <span><b>{t("ownerLabel")}</b> Muhammed Emin TEMEL</span>
          <span><b>{t("locationLabel")}</b> Günsev Oto AVM, Gaziantep</span>
          <span><b>{t("licenseLabel")}</b> 2701072</span>
        </div>
      </section>

      <div className="container ad-band"><AdSlot placement="home-top" /></div>
      <LatestJournal />

      <section className="inventory-section" id="araclarimiz"><div className="container">
        <div className="section-heading inventory-heading"><div><span className="eyebrow eyebrow-light">{t("inventoryEyebrow")}</span><h2>{t("inventoryTitleA")} <em>{t("inventoryTitleB")}</em></h2></div><Link href="/araclar" className="inventory-view-all">{t("inventoryViewAll")} <ArrowRight size={15} /></Link></div>
        <VehicleCatalog featuredOnly />
        <div className="inventory-footnote">{t("inventoryFootnote")}</div>
      </div></section>

      <section className="section services-section" id="hizmetler">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">{t("servicesEyebrow")}</span><h2>{t("servicesTitleA")}<br /><em>{t("servicesTitleB")}</em></h2></div><p className="section-heading-copy">{t("servicesCopy")}</p></div>
          <div className="service-grid">
            <article className="service-card"><div className="service-card-top"><span className="service-icon"><CarFront size={22} strokeWidth={1.6} /></span><span className="service-index">01 / {t("service1Tag")}</span></div><h3>{t("service1TitleA")}<br />{t("service1TitleB")}</h3><p>{t("service1Text")}</p><a className="service-link" href={`tel:${phone}`}>{t("service1Link")} <ArrowRight size={15} /></a></article>
            <article className="service-card service-card-dark"><div className="service-card-top"><span className="service-icon"><Scale size={21} strokeWidth={1.6} /></span><span className="service-index">02 / {t("service2Tag")}</span></div><h3>{t("service2TitleA")}<br />{t("service2TitleB")}</h3><p>{t("service2Text")}</p><a className="service-link" href={`tel:${phone}`}>{t("service2Link")} <ArrowRight size={15} /></a></article>
          </div>
        </div>
      </section>

      <div className="container ad-band"><AdSlot placement="home-middle" /></div>

      <section className="approach-section"><div className="container approach-layout">
        <div className="approach-heading"><span className="eyebrow">{t("approachEyebrow")}</span><h2>{t("approachTitleA")} <em>{t("approachTitleB")}</em><br />{t("approachTitleC")}</h2><p>{t("approachText")}</p><a className="text-link" href={`tel:${phone}`}>{t("approachLink")} <ArrowRight size={15} /></a></div>
        <div className="approach-steps"><div className="approach-step"><span>01</span><div><h3>{t("step1Title")}</h3><p>{t("step1Text")}</p></div><Handshake size={19} strokeWidth={1.5} /></div><div className="approach-step"><span>02</span><div><h3>{t("step2Title")}</h3><p>{t("step2Text")}</p></div><ShieldCheck size={19} strokeWidth={1.5} /></div><div className="approach-step"><span>03</span><div><h3>{t("step3Title")}</h3><p>{t("step3Text")}</p></div><ArrowRight size={19} strokeWidth={1.5} /></div></div>
      </div></section>

      <div className="container ad-band"><AdSlot placement="home-bottom" /></div>

      <HomeTrust />

      <section className="contact-banner"><div className="container contact-inner"><div><span className="eyebrow eyebrow-light">TML MOTORS · GAZİANTEP</span><h2>{t("contactBannerTitle")}</h2><p>{t("contactBannerText")}</p></div><div className="contact-actions"><a className="button button-primary" href={`tel:${phone}`}>+90 553 578 11 36 <Phone size={16} /></a><a className="contact-link" href={`https://wa.me/${phone.replace("+", "")}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> {t("whatsappCta")}</a><a className="contact-link" href={mapsUrl} target="_blank" rel="noopener noreferrer"><Navigation size={16} /> {t("directionsCta")}</a></div></div></section>
    </>
  );
}
