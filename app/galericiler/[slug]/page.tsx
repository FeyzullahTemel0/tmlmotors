import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MapPin, Phone } from "lucide-react";
import { getAdminDb } from "@/lib/firebase-admin";
import { publicDealer } from "@/lib/dealer-server";
import { JsonLd } from "@/components/json-ld";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

async function loadDealer(slug: string) {
  try {
    const snapshot = await getAdminDb().collection("dealers").where("slug", "==", slug).limit(1).get();
    const document = snapshot.docs[0];
    if (!document || document.data().active !== true) return null;
    return publicDealer(document.data());
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dealer = await loadDealer(slug);
  if (!dealer) return { title: "Galerici bulunamadı", robots: { index: false } };
  return {
    title: dealer.businessName,
    description: (dealer.about || `${dealer.businessName} anlaşmalı oto galerici profili.`).slice(0, 155),
    alternates: { canonical: `/galericiler/${dealer.slug}` },
    openGraph: dealer.photos[0] ? { images: [dealer.photos[0]] } : undefined,
  };
}

export default async function DealerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dealer = await loadDealer(slug);
  if (!dealer) notFound();

  const links = [
    { label: "sahibinden.com profili", url: dealer.sahibindenUrl },
    { label: "arabam.com profili", url: dealer.arabamUrl },
    { label: "Instagram", url: dealer.instagramUrl },
    { label: "Facebook", url: dealer.facebookUrl },
    { label: "YouTube", url: dealer.youtubeUrl },
    { label: "Web sitesi", url: dealer.websiteUrl },
  ].filter((item) => item.url);

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "AutoDealer", name: dealer.businessName, url: `${getSiteUrl()}/galericiler/${dealer.slug}`, ...(dealer.phone ? { telephone: dealer.phone } : {}), ...(dealer.photos.length ? { image: dealer.photos } : {}), address: { "@type": "PostalAddress", addressLocality: dealer.city || "Gaziantep", streetAddress: dealer.address || undefined, addressCountry: "TR" } }} />
      <section className="subpage-hero"><div className="container">
        <span className="eyebrow eyebrow-light">ANLAŞMALI GALERİCİ</span>
        <h1>{dealer.businessName}</h1>
        {dealer.city || dealer.address ? <p><MapPin size={14} style={{ verticalAlign: "-2px" }} /> {[dealer.address, dealer.city].filter(Boolean).join(", ")}</p> : null}
      </div></section>
      <section className="listing-section"><div className="container">
        <p style={{ marginBottom: 20 }}><Link className="text-link" href="/galericiler"><ArrowLeft size={14} /> Tüm galericiler</Link></p>
        {dealer.photos.length ? <div className="dealer-hero-gallery">{dealer.photos.map((photo, index) => <img key={photo} src={photo} alt={`${dealer.businessName} fotoğraf ${index + 1}`} loading={index ? "lazy" : "eager"} />)}</div> : null}
        <div className="dealer-info">
          <div>
            <h2 style={{ margin: "0 0 12px", font: "700 20px var(--sans)" }}>İşletme hakkında</h2>
            <p style={{ margin: 0, lineHeight: 1.85, color: "#3f4240", whiteSpace: "pre-line" }}>{dealer.about || "Bu işletme henüz tanıtım metni eklememiş."}</p>
          </div>
          <div className="dealer-links">
            {dealer.phone ? <a href={`tel:${dealer.phone.replace(/[^\d+]/g, "")}`}><span><Phone size={14} style={{ verticalAlign: "-2px" }} /> {dealer.phone}</span> <ArrowUpRight size={15} /></a> : null}
            {links.map((item) => <a key={item.label} href={item.url} target="_blank" rel="noopener noreferrer nofollow"><span>{item.label}</span> <ArrowUpRight size={15} /></a>)}
          </div>
        </div>
      </div></section>
    </>
  );
}
