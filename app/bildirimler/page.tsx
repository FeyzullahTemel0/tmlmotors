"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Bell, ChevronRight, Megaphone, MessageSquareText } from "lucide-react";
import { Loading } from "@/components/loading";
import { getFirebaseAuth, getFirebaseConnectionStatus } from "@/lib/firebase-client";

type Item = { id: string; kind: "announcement" | "complaint"; title: string; message: string; link: string; createdAt: number; unread: boolean };

function relativeTime(value: number) {
  const minutes = Math.round((Date.now() - value) / 60000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} sa önce`;
  return new Date(value).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getFirebaseConnectionStatus().ready) {
      setError("Bildirimler şu anda kullanılamıyor.");
      return;
    }
    return onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        router.replace("/giris?next=/bildirimler");
        return;
      }
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const data = await response.json() as { items?: Item[]; serverTime?: number; error?: string };
        if (!response.ok || !data.items) throw new Error(data.error ?? "Bildirimler alınamadı.");
        setItems(data.items);
        // Ekran açıldığı anda gösterilen her şey okundu sayılır; "Yeni" etiketleri bu oturumda görünür kalır.
        if (data.items.some((item) => item.unread)) {
          await fetch("/api/notifications", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ until: data.serverTime }) });
          window.dispatchEvent(new Event("tml-notifications-read"));
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Bildirimler alınamadı.");
      }
    });
  }, [router]);

  return (
    <>
      <section className="subpage-hero"><div className="container">
        <span className="eyebrow eyebrow-light">BİLDİRİMLER</span>
        <h1>Bildirimlerim</h1>
        <p>Duyurular ve hesabınızla ilgili gelişmeler burada listelenir. Bir bildirime dokunarak ilgili sayfaya gidebilirsiniz.</p>
      </div></section>
      <section className="listing-section"><div className="container page-narrow">
        {error ? <div className="form-notice error" role="alert">{error}</div> : null}
        {!items && !error ? <Loading label="Bildirimler yükleniyor" /> : null}
        {items && items.length ? (
          <div className="notif-list">
            {items.map((item) => (
              <Link href={item.link} key={item.id} className={item.unread ? "notif-item is-unread" : "notif-item"}>
                <span className="notif-icon">{item.kind === "announcement" ? <Megaphone size={17} /> : <MessageSquareText size={17} />}</span>
                <span className="notif-body">
                  <b>{item.title}{item.unread ? <em>Yeni</em> : null}</b>
                  {item.message ? <small>{item.message}</small> : null}
                  <time>{relativeTime(item.createdAt)}</time>
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}
          </div>
        ) : null}
        {items && !items.length ? <div className="catalog-empty"><Bell size={22} /><h3>Henüz bildiriminiz yok</h3><p>Yeni duyurular ve şikayet yanıtları burada görünür.</p></div> : null}
      </div></section>
    </>
  );
}
