"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import { faqItems } from "@/lib/faq-data";

type Review = { id: string; name: string; rating: number; comment: string; createdAt: number };

export function HomeTrust() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const response = await fetch("/api/reviews");
        if (!response.ok) return;
        const data = await response.json() as { reviews: Review[]; summary: { count: number; average: number } };
        if (!mounted) return;
        setReviews(data.reviews.slice(0, 3));
        setSummary(data.summary);
      } catch {
        // Yorumlar alınamazsa bölüm gizli kalır.
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <section className="home-section"><div className="container">
        <div className="home-section-head">
          <div><span className="eyebrow">ARACINIZI SATMAK MI İSTİYORSUNUZ?</span><h2>Aracınızın değerini birlikte belirleyelim</h2></div>
          <Link className="button button-primary" href="/aracimi-sat">Ücretsiz değerleme talebi <ArrowRight size={16} /></Link>
        </div>
        <p style={{ margin: 0, maxWidth: 720, color: "#4a4d49", lineHeight: 1.8 }}>Aracınızın bilgilerini paylaşın, ekibimiz sizi arasın. Değerleme ve görüşme ücretsizdir; hiçbir aşamada sizden ödeme istenmez.</p>
      </div></section>

      {reviews.length ? (
        <section className="home-section" style={{ paddingTop: 0 }}><div className="container">
          <div className="home-section-head">
            <div><span className="eyebrow">MÜŞTERİ YORUMLARI</span><h2>{summary.average.toFixed(1)} / 5 <small style={{ font: "400 15px var(--sans)", color: "#6b6f6c" }}>({summary.count} yorum)</small></h2></div>
            <Link className="text-link" href="/yorumlar">Tüm yorumlar <ArrowRight size={14} /></Link>
          </div>
          <div className="review-list" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <header><b>{review.name || "Müşteri"}</b><span className="review-stars" aria-label={`${review.rating} yıldız`}>{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}</span></header>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        </div></section>
      ) : null}

      <section className="home-section" style={{ paddingTop: 0 }}><div className="container">
        <div className="home-section-head">
          <div><span className="eyebrow">SIKÇA SORULAN SORULAR</span><h2>Aklınıza takılanlar</h2></div>
          <Link className="text-link" href="/sss">Tüm sorular <ArrowRight size={14} /></Link>
        </div>
        <div className="faq-list">
          {faqItems.slice(0, 4).map((item) => (
            <details className="faq-item" key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
          ))}
        </div>
      </div></section>
    </>
  );
}
