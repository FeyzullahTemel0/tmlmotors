"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { getAdPlacement, type AdShape, type PublicAd } from "@/lib/ad-placements";

type CreativeAd = Pick<PublicAd, "business" | "title" | "description" | "imageUrl">;

// Reklam engelleyiciler "/ads/" içeren görsel adreslerini kestiği için tarayıcıya nötr bir yol verilir.
function toPartnerUrl(url: string) {
  return url.replace(/^(https?:\/\/[^/]+)?\/media\/tml-motors\/ads\/([^/?#]+)/, "$1/gorsel/partner/$2");
}

export function AdCreative({ ad: rawAd, shape, ratio }: { ad: CreativeAd; shape: AdShape; ratio?: string }) {
  const ad = { ...rawAd, imageUrl: rawAd.imageUrl ? toPartnerUrl(rawAd.imageUrl) : "" };
  // Görsel, alanın oranına göre kırpılmadan sığdırılır; boş kalan kısım aynı görselin bulanık hâliyle doldurulur.
  const style = ad.imageUrl ? { ...(ratio ? { aspectRatio: ratio } : {}), ["--ad-img" as string]: `url("${ad.imageUrl}")` } : undefined;
  return (
    <span className={`ad-creative ad-shape-${shape}${ad.imageUrl ? " has-image" : ""}`} style={style}>
      {ad.imageUrl ? <img src={ad.imageUrl} alt={ad.title || ad.business} loading="lazy" /> : (
        <span className="ad-creative-copy">
          <span className="ad-creative-business">{ad.business || "İşletme adı"}</span>
          <b>{ad.title || "Reklam başlığı"}</b>
          {ad.description ? <span className="ad-creative-description">{ad.description}</span> : null}
          <ArrowUpRight size={18} />
        </span>
      )}
      <span className="ad-creative-tag">Reklam</span>
    </span>
  );
}

const MAX_ROW_ADS = 4;

// Aynı önceliğe sahip reklamlar kendi aralarında karıştırılır; yüksek öncelik her zaman önce gelir.
function orderAds(ads: PublicAd[]) {
  return [...ads].sort((a, b) => b.priority - a.priority || Math.random() - 0.5);
}

function trackClick(id: string) {
  void navigator.sendBeacon?.("/api/sponsors/click", new Blob([JSON.stringify({ id })], { type: "application/json" }));
}

export function AdSlot({ placement, className = "" }: { placement: string; className?: string }) {
  const [ads, setAds] = useState<PublicAd[]>([]);
  const definition = getAdPlacement(placement);

  useEffect(() => {
    let mounted = true;
    void fetch(`/api/sponsors?placement=${encodeURIComponent(placement)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Reklam yüklenemedi.");
        if (mounted) setAds(orderAds(result.ads as PublicAd[]));
      })
      .catch((error: unknown) => console.error("Reklam alanı yüklenemedi:", error));
    return () => { mounted = false; };
  }, [placement]);

  if (!ads.length || !definition) return null;

  const isRow = definition.shape !== "tall";
  const visibleAds = isRow ? ads.slice(0, MAX_ROW_ADS) : ads.slice(0, 1);
  const count = visibleAds.length;
  // Yan yana reklamlarda yükseklik sabit kalır, genişlik eşit bölünür.
  const ratio = `${Math.round(definition.width / count)} / ${definition.height}`;

  return (
    <aside className={`promo-slot promo-slot-${definition.shape}${isRow ? " promo-slot-row" : ""} ${className}`.trim()} aria-label="Sponsorlu içerik">
      <div className="ad-grid-row" data-count={count}>
        {visibleAds.map((ad) => (
          <a key={ad.id} href={ad.url} target="_blank" rel="sponsored noopener noreferrer" onClick={() => trackClick(ad.id)}>
            <AdCreative ad={ad} shape={definition.shape} ratio={ad.imageUrl ? ratio : undefined} />
          </a>
        ))}
      </div>
    </aside>
  );
}
