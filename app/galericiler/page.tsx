import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { getAdminDb } from "@/lib/firebase-admin";
import { publicDealer } from "@/lib/dealer-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anlaşmalı Oto Galericiler",
  description: "TML MOTORS ile çalışan anlaşmalı oto galericilerin işletme profilleri, fotoğrafları ve ilan bağlantıları.",
  alternates: { canonical: "/galericiler" },
};

async function loadDealers() {
  try {
    const snapshot = await getAdminDb().collection("dealers").where("active", "==", true).limit(100).get();
    return snapshot.docs
      .map((document) => publicDealer(document.data()))
      .filter((dealer) => dealer.businessName && dealer.slug)
      .sort((a, b) => a.businessName.localeCompare(b.businessName, "tr-TR"));
  } catch {
    return [];
  }
}

export default async function DealersPage() {
  const dealers = await loadDealers();
  return (
    <>
      <section className="subpage-hero hero-hide-mobile"><div className="container">
        <span className="eyebrow eyebrow-light">ANLAŞMALI GALERİCİLER</span>
        <h1>Güvendiğimiz oto galerici ortaklarımız</h1>
        <p>TML MOTORS ile birlikte çalışan işletmeleri, fotoğraflarını ve ilan profillerini bu sayfadan inceleyebilirsiniz.</p>
      </div></section>
      <section className="listing-section"><div className="container">
        {dealers.length ? (
          <div className="dealer-grid">
            {dealers.map((dealer) => (
              <Link className="dealer-card" href={`/galericiler/${dealer.slug}`} key={dealer.slug}>
                <div className="dealer-card-image" style={dealer.photos[0] ? { backgroundImage: `url("${dealer.photos[0]}")` } : undefined} role="img" aria-label={dealer.businessName} />
                <div className="dealer-card-body">
                  <b>{dealer.businessName}</b>
                  {dealer.city ? <span><MapPin size={13} style={{ verticalAlign: "-2px" }} /> {dealer.city}</span> : null}
                  <span className="text-link" style={{ border: 0, padding: 0 }}>Profili incele <ArrowRight size={13} /></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="catalog-empty"><span className="eyebrow">GALERİCİLER</span><h3>Profiller yakında burada olacak</h3><p>Anlaşmalı galerici profilleri yayınlandıkça bu sayfada listelenir.</p><Building2 size={20} /></div>
        )}
      </div></section>
    </>
  );
}
