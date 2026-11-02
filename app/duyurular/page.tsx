import type { Metadata } from "next";
import { Car, CarFront, Clock, Megaphone, MessageCircle, Phone, Store, Wallet, BadgeCheck } from "lucide-react";
import { getAdminDb } from "@/lib/firebase-admin";
import { describePriceRange } from "@/lib/announcements";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Duyurular",
  description: "TML MOTORS'un aradığı araç duyuruları ve güncel bilgilendirmeler. Aracınız bu kriterlere uyuyorsa bizimle iletişime geçin.",
  alternates: { canonical: "/duyurular" },
};

const TML_PHONE = "905535781136";

type Announcement = {
  id: string; title: string; message: string; brand: string; model: string; bodyType: string;
  minPrice: number | null; maxPrice: number | null; businessName: string; phone: string; createdAt: number;
};

async function loadAnnouncements(): Promise<Announcement[]> {
  try {
    const snapshot = await getAdminDb().collection("announcements").orderBy("createdAt", "desc").limit(100).get();
    const items = snapshot.docs.map((document) => {
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
        businessName: String(data.businessName ?? ""),
        phone: String(data.phone ?? ""),
        createdAt: (data.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0,
      };
    });
    // TML MOTORS duyuruları her zaman en üstte; kendi içinde ve diğerlerinde en yeni önce.
    return [...items.filter((item) => !item.businessName), ...items.filter((item) => item.businessName)];
  } catch {
    return [];
  }
}

function formatDate(value: number) {
  return new Date(value).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
}

function AnnouncementCard({ item }: { item: Announcement }) {
  const own = !item.businessName;
  const phone = item.phone || TML_PHONE;
  const vehicle = [item.brand, item.model].filter(Boolean).join(" ");
  const price = describePriceRange(item.minPrice, item.maxPrice);
  const facts = [
    { icon: <Car size={16} />, label: "Araç", value: vehicle },
    { icon: <CarFront size={16} />, label: "Sınıf", value: item.bodyType },
    { icon: <Wallet size={16} />, label: "Bütçe", value: price },
  ].filter((fact) => fact.value);
  const whatsapp = encodeURIComponent(`Merhaba, "${item.title}" duyurunuz için aracım var.`);

  return (
    <article className={`ann-card${own ? " is-own" : ""}`} id={item.id}>
      <div className="ann-top">
        <span className="ann-badge">
          {own ? <BadgeCheck size={14} /> : <Store size={14} />}
          {own ? "TML MOTORS" : item.businessName}
        </span>
        {item.createdAt ? <time dateTime={new Date(item.createdAt).toISOString()}><Clock size={13} /> {formatDate(item.createdAt)}</time> : null}
      </div>
      <div className="ann-main">
        <span className="ann-icon"><Megaphone size={20} /></span>
        <h2>{item.title}</h2>
      </div>
      {facts.length ? (
        <dl className="ann-facts">
          {facts.map((fact) => (
            <div key={fact.label}><dt>{fact.icon}{fact.label}</dt><dd>{fact.value}</dd></div>
          ))}
        </dl>
      ) : null}
      {item.message ? <p>{item.message}</p> : null}
      <footer>
        <a className="ann-btn ann-btn-call" href={`tel:+${phone}`}><Phone size={16} /> Ara</a>
        <a className="ann-btn ann-btn-wa" href={`https://wa.me/${phone}?text=${whatsapp}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> WhatsApp</a>
      </footer>
    </article>
  );
}

export default async function AnnouncementsPage() {
  const announcements = await loadAnnouncements();
  return (
    <>
      <section className="subpage-hero hero-hide-mobile"><div className="container">
        <span className="eyebrow eyebrow-light">DUYURULAR</span>
        <h1>Aradığımız araçlar ve güncel duyurular</h1>
        <p>Talep edilen araçları burada paylaşıyoruz. Aracınız bu ölçütlere uyuyorsa doğrudan bizimle iletişime geçebilirsiniz.</p>
      </div></section>
      <section className="listing-section"><div className="container page-narrow">
        {announcements.length ? (
          <div className="ann-list">
            {announcements.map((item) => <AnnouncementCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="catalog-empty"><span className="eyebrow">DUYURULAR</span><h3>Şu anda yayında duyuru yok</h3><p>Yeni bir araç talebi veya bilgilendirme paylaşıldığında burada görünür.</p></div>
        )}
      </div></section>
    </>
  );
}
