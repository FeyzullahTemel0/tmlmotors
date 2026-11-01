"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { VehicleCatalog } from "@/components/vehicle-catalog";
import { AdSlot } from "@/components/ad-slot";

export default function DamagedVehiclesPage() {
  return (
    <>
      <section className="subpage-hero inventory-hero"><div className="container">
        <span className="eyebrow eyebrow-light">TML MOTORS · HASAR KAYITLI ARAÇLAR</span>
        <h1>Ağır hasarlı araç alım satım</h1>
        <p>Hasar bilgisi saklanmadan, her ilanda neyin değiştiğini ve neyin onarıldığını açıkça paylaşıyoruz. Bu sayfadaki araçlar, normal ilanlarımızdan ayrı listelenir.</p>
      </div></section>
      <section className="listing-section"><div className="container listing-with-aside">
        <div className="listing-main">
          <div className="damaged-info"><ShieldAlert size={20} aria-hidden="true" /><p><b>Satın almadan önce:</b> Ağır hasar kaydı olan araçlarda hasar bilgisi ve ekspertiz raporu ilan sahibiyle birlikte incelenmelidir. Dilediğiniz aracı bağımsız bir ekspertizde kontrol ettirmenize her zaman yardımcı oluruz.</p></div>
          <AdSlot placement="listing-top" />
          <VehicleCatalog scope="damaged" />
          <div className="sell-callout"><div><span className="eyebrow">HASARLI ARACINIZI SATIN</span><h2>Hasarlı aracınız için dürüst bir değerleme</h2><p>Aracınızın durumunu paylaşın; hasar kaydını olduğu gibi değerlendirip size açık bir dönüş yapalım.</p></div><Link className="button button-primary" href="/aracimi-sat">Değerleme talebi oluştur <ArrowRight size={16} /></Link></div>
        </div>
        <div className="listing-aside"><AdSlot placement="listing-side" /></div>
      </div></section>
    </>
  );
}
