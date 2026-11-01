"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowUpRight, Star } from "lucide-react";
import { getFirebaseAuth, getFirebaseConnectionStatus } from "@/lib/firebase-client";
import { Loading } from "@/components/loading";

type Review = { id: string; name: string; rating: number; comment: string; reply: string; createdAt: number };

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return <span className="review-stars" aria-label={`5 üzerinden ${value}`}>{[1, 2, 3, 4, 5].map((index) => <Star key={index} size={size} fill={index <= Math.round(value) ? "currentColor" : "none"} />)}</span>;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [googleUrl, setGoogleUrl] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!getFirebaseConnectionStatus().ready) return;
    return onAuthStateChanged(getFirebaseAuth(), setUser);
  }, []);

  useEffect(() => {
    let mounted = true;
    void fetch("/api/reviews").then((response) => response.json()).then((data: { reviews?: Review[]; summary?: { count: number; average: number } }) => {
      if (!mounted) return;
      setReviews(data.reviews ?? []);
      setSummary(data.summary ?? { count: 0, average: 0 });
    }).catch(() => undefined).finally(() => { if (mounted) setLoading(false); });
    void fetch("/api/site-settings").then((response) => response.json()).then((data: { links?: { googleReview?: string } }) => {
      if (mounted) setGoogleUrl(data.links?.googleReview ?? "");
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, name: user.displayName ?? "" }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Yorumunuz gönderilemedi.");
      setMessage({ type: "success", text: "Yorumunuz için teşekkür ederiz. Onaylandıktan sonra bu sayfada yayınlanacaktır." });
      setComment("");
      setRating(0);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Yorumunuz gönderilemedi." });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="subpage-hero"><div className="container">
        <span className="eyebrow eyebrow-light">MÜŞTERİ YORUMLARI</span>
        <h1>Müşterilerimiz ne diyor?</h1>
        <p>Yorumlar, yönetici onayından sonra olduğu gibi yayınlanır. Deneyiminizi paylaşarak başkalarına yol gösterebilirsiniz.</p>
      </div></section>
      <section className="listing-section"><div className="container">
        {summary.count ? <div className="review-summary"><span className="review-score">{summary.average.toFixed(1)}</span><div><Stars value={summary.average} size={20} /><div style={{ color: "#777a75", fontSize: 13, marginTop: 4 }}>{summary.count} onaylı yorum</div></div></div> : null}
        {loading ? <Loading label="Yorumlar yükleniyor" /> : null}
        {!loading && reviews.length ? <div className="review-list">{reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <header><b>{review.name}</b><time dateTime={new Date(review.createdAt).toISOString()}>{new Date(review.createdAt).toLocaleDateString("tr-TR", { year: "numeric", month: "long" })}</time></header>
            <Stars value={review.rating} />
            <p>{review.comment}</p>
            {review.reply ? <div className="review-reply"><b>TML MOTORS yanıtı:</b> {review.reply}</div> : null}
          </article>
        ))}</div> : null}
        {!loading && !reviews.length ? <div className="form-notice info">Henüz yayınlanmış yorum yok. İlk yorumu siz bırakabilirsiniz.</div> : null}

        <div className="page-narrow" style={{ marginTop: 40 }}>
          <form className="form-card" onSubmit={submit}>
            <h2>Deneyiminizi paylaşın</h2>
            {!user ? <p className="form-notice info">Yorum yazmak için <Link className="text-link" href="/giris?next=/yorumlar">giriş yapın</Link>. Her üye bir yorum yazabilir.</p> : (
              <>
                <div className="form-field"><label>Puanınız</label><div className="star-input" role="radiogroup" aria-label="Puan">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} yıldız`} className={value <= rating ? "on" : ""} onClick={() => setRating(value)}><Star size={26} fill={value <= rating ? "currentColor" : "none"} /></button>)}</div></div>
                <div className="form-field"><label htmlFor="review-comment">Yorumunuz</label><textarea id="review-comment" required minLength={10} maxLength={600} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Süreç nasıl geçti? Neler iyiydi, neler daha iyi olabilirdi?" /><small>{comment.length}/600</small></div>
                {message ? <div className={`form-notice ${message.type}`} role="status">{message.text}</div> : null}
                <button type="submit" className="button button-primary" disabled={sending || rating === 0 || comment.trim().length < 10}>{sending ? "Gönderiliyor..." : "Yorumu gönder"}</button>
              </>
            )}
            {googleUrl ? <a className="text-link" href={googleUrl} target="_blank" rel="noopener noreferrer">Google&apos;da da yorum bırakın <ArrowUpRight size={14} /></a> : null}
          </form>
        </div>
      </div></section>
    </>
  );
}
