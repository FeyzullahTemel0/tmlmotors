import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle, Megaphone } from "lucide-react";
import { getAdminDb } from "@/lib/firebase-admin";
import { describePriceRange } from "@/lib/announcements";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Duyurular",
  description: "TML MOTORS'un aradığı araç duyuruları ve güncel bilgilendirmeler. Aracınız bu kriterlere uyuyorsa bizimle iletişime geçin.",
  alternates: { canonical: "/duyurular" },
};

type Announcement = { id: string; title: string; message: string; brand: string; model: string; bodyType: string; minPrice: number | null; maxPrice: number | null; createdAt: number };

async function loadAnnouncements(): Promise<Announcement[]> {
  try {
    const snapshot = await getAdminDb().collection("announcements").orderBy("createdAt", "desc").limit(50).get();
    return snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        title: String(data.title ?? ""),
        message: String(data.message ?? ""),
        brand: String(data.brand ?? ""),
        model: String(data.model ?? ""),
        bodyType: String(data.bodyType ?? ""),
        minPrice: typeof data.minPrice === "number" ? data.minPrice : null,
        maxPrice: typeof data.maxPrice === "number" ? data.maxPrice : null,
        createdAt: (data.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0,
      };
    });
  } catch {
    return [];
  }
}

export default async function AnnouncementsPage() {
  const announcements = await loadAnnouncements();
  return (
    <>
      <section className="subpage-hero"><div className="container">
        <span className="eyebrow eyebrow-light">DUYURULAR</span>
        <h1>Aradığımız araçlar ve güncel duyurular</h1>
        <p>Müşterilerimizin talep ettiği araçları burada paylaşıyoruz. Aracınız bu ölçütlere uyuyorsa, satış sürecini birlikte yürütelim.</p>
      </div></section>
      <section className="listing-section"><div className="container page-narrow">
        {announcements.length ? (
          <div className="ann-list">
            {announcements.map((item) => {
              const price = describePriceRange(item.minPrice, item.maxPrice);
              const chips = [[item.brand, item.model].filter(Boolean).join(" "), item.bodyType, price].filter(Boolean);
              const whatsapp = encodeURIComponent(`Merhaba, "${item.title}" duyurunuz için aracım var.`);
              return (
                <article className="ann-card" id={item.id} key={item.id}>
                  <header>
                    <span className="ann-icon"><Megaphone size={16} /></span>
                    <div><h2>{item.title}</h2>{item.createdAt ? <time dateTime={new Date(item.createdAt).toISOString()}>{new Date(item.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</time> : null}</div>
                  </header>
                  {chips.length ? <ul className="ann-chips">{chips.map((chip) => <li key={chip}>{chip}</li>)}</ul> : null}
                  <p>{item.message}</p>
                  <footer>
                    <a className="button button-primary" href={`https://wa.me/905535781136?text=${whatsapp}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Aracım var, yazın</a>
                    <Link className="text-link" href="/aracimi-sat">Değerleme talebi <ArrowRight size={14} /></Link>
                  </footer>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="catalog-empty"><span className="eyebrow">DUYURULAR</span><h3>Şu anda yayında duyuru yok</h3><p>Yeni bir araç talebi veya bilgilendirme paylaşıldığında burada görünür.</p></div>
        )}
      </div></section>
    </>
  );
}
