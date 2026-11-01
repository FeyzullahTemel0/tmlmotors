"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Building2, Car, Check, Eye, Heart, Megaphone, MessageCircle, Phone, Star, Trash2, X } from "lucide-react";
import { bodyTypeOptions } from "@/lib/announcements";

async function api<T>(user: User, url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${await user.getIdToken()}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "İstek tamamlanamadı.");
  return result as T;
}

const formatDate = (value: number) => (value ? new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "-");

function useRemote<T>(user: User, url: string, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setData(await api<T>(user, url));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Veriler alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [user, url]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload, setError };
}

function Notice({ error }: { error: string }) {
  return error ? <div className="adm-alert is-error" role="alert">{error}</div> : null;
}

export function useBusinessBadges(user: User | null, refreshKey: string) {
  const [badges, setBadges] = useState({ sell: 0, reviews: 0 });
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    void (async () => {
      try {
        const [sell, reviews] = await Promise.all([
          api<{ requests: { status: string }[] }>(user, "/api/admin/sell-requests"),
          api<{ reviews: { status: string }[] }>(user, "/api/admin/reviews"),
        ]);
        if (mounted) setBadges({ sell: sellRequestCount(sell.requests), reviews: pendingReviewCount(reviews.reviews) });
      } catch {
        if (mounted) setBadges({ sell: 0, reviews: 0 });
      }
    })();
    return () => { mounted = false; };
  }, [user, refreshKey]);
  return badges;
}

/* ---------------------------------- İstatistikler ---------------------------------- */

type StatItem = { id: string; title: string; status: string; heavyDamage: boolean; views: number; uniqueViewers: number; favorites: number; lastViewedAt: number };
type StatDetail = {
  viewers: { id: string; registered: boolean; name: string; email: string; count: number; lastViewedAt: number }[];
  favorites: { id: string; name: string; email: string; createdAt: number }[];
};

export function StatsPanel({ user }: { user: User }) {
  const { data, loading, error, setError } = useRemote<{ items: StatItem[]; totals: { views: number; favorites: number } }>(user, "/api/admin/stats", { items: [], totals: { views: 0, favorites: 0 } });
  const [selected, setSelected] = useState<StatItem | null>(null);
  const [detail, setDetail] = useState<StatDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function open(item: StatItem) {
    setSelected(item);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await api<StatDetail>(user, `/api/admin/stats?vehicleId=${encodeURIComponent(item.id)}`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Detay alınamadı.");
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <>
      <Notice error={error} />
      <div className="adm-stats">
        <div><span>Toplam görüntülenme</span><b>{data.totals.views}</b></div>
        <div><span>Toplam favori</span><b>{data.totals.favorites}</b></div>
        <div><span>İlan sayısı</span><b>{data.items.length}</b></div>
      </div>
      <section className="adm-card">
        <header className="adm-card-head"><div><h2>İlan performansı <small>Admin görüntülemeleri sayılmaz</small></h2></div></header>
        {loading ? <div className="adm-empty"><p>Yükleniyor...</p></div> : data.items.length ? (
          <div className="adm-rows">
            {data.items.map((item) => (
              <article className="adm-row" key={item.id}>
                <div className="adm-row-info">
                  <div className="adm-row-title"><b>{item.title || "İsimsiz ilan"}</b>{item.heavyDamage ? <span className="adm-pill amber">Ağır hasarlı</span> : null}</div>
                  <small><Eye size={12} /> {item.views} görüntülenme · {item.uniqueViewers} tekil ziyaretçi · <Heart size={12} /> {item.favorites} favori · Son: {formatDate(item.lastViewedAt)}</small>
                </div>
                <button className="adm-btn ghost sm" onClick={() => void open(item)}>Kim baktı?</button>
              </article>
            ))}
          </div>
        ) : <div className="adm-empty"><Car size={28} /><h3>Henüz ilan yok</h3><p>İlan eklendikçe istatistikler burada görünür.</p></div>}
      </section>
      {selected ? (
        <section className="adm-card">
          <header className="adm-card-head"><div><h2>{selected.title}</h2></div><button className="adm-icon-btn" aria-label="Kapat" onClick={() => setSelected(null)}><X size={16} /></button></header>
          {detailLoading ? <div className="adm-empty"><p>Yükleniyor...</p></div> : detail ? (
            <div className="adm-stack">
              <h3 style={{ margin: "4px 0", font: "700 14px var(--sans)" }}>Görüntüleyenler ({detail.viewers.length})</h3>
              {detail.viewers.length ? <div className="adm-rows">{detail.viewers.map((viewer) => (
                <article className="adm-row" key={viewer.id}>
                  <div className="adm-row-info">
                    <div className="adm-row-title"><b>{viewer.registered ? viewer.name || "Üye" : "Misafir ziyaretçi"}</b>{viewer.registered ? <span className="adm-pill green">Üye</span> : <span className="adm-pill gray">Misafir</span>}</div>
                    <small>{viewer.email || "E-posta yok"} · {viewer.count} kez · Son: {formatDate(viewer.lastViewedAt)}</small>
                  </div>
                </article>
              ))}</div> : <p style={{ margin: 0, color: "#6b6f6c" }}>Henüz görüntüleyen yok.</p>}
              <h3 style={{ margin: "12px 0 4px", font: "700 14px var(--sans)" }}>Favoriye ekleyenler ({detail.favorites.length})</h3>
              {detail.favorites.length ? <div className="adm-rows">{detail.favorites.map((favorite) => (
                <article className="adm-row" key={favorite.id}>
                  <div className="adm-row-info"><div className="adm-row-title"><b>{favorite.name || "Üye"}</b></div><small>{favorite.email || "E-posta yok"} · {formatDate(favorite.createdAt)}</small></div>
                </article>
              ))}</div> : <p style={{ margin: 0, color: "#6b6f6c" }}>Henüz favoriye ekleyen yok.</p>}
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

/* ------------------------------- Aracımı sat talepleri ------------------------------- */

type SellRequest = {
  id: string; name: string; phone: string; city: string; brand: string; model: string; year: number; mileage: number;
  fuel: string; transmission: string; damage: string; expectedPrice: number | null; note: string; status: "new" | "contacted" | "closed"; createdAt: number;
};
const sellStatus: Record<SellRequest["status"], { label: string; tone: string }> = {
  new: { label: "Yeni", tone: "blue" }, contacted: { label: "Arandı", tone: "amber" }, closed: { label: "Kapandı", tone: "gray" },
};

export function sellRequestCount(requests: { status: string }[]) {
  return requests.filter((item) => item.status === "new").length;
}

export function SellRequestsPanel({ user }: { user: User }) {
  const { data, loading, error, reload, setError } = useRemote<{ requests: SellRequest[] }>(user, "/api/admin/sell-requests", { requests: [] });

  async function setStatus(id: string, status: SellRequest["status"]) {
    try {
      await api(user, "/api/admin/sell-requests", "PATCH", { id, status });
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Güncellenemedi.");
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Bu talep kalıcı olarak silinsin mi?")) return;
    try {
      await api(user, `/api/admin/sell-requests?id=${encodeURIComponent(id)}`, "DELETE");
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Silinemedi.");
    }
  }

  return (
    <section className="adm-card">
      <Notice error={error} />
      <header className="adm-card-head"><div><h2>Gelen talepler <small>{sellRequestCount(data.requests)} yeni</small></h2></div><button className="adm-btn ghost sm" onClick={() => void reload()}>Yenile</button></header>
      {loading ? <div className="adm-empty"><p>Yükleniyor...</p></div> : data.requests.length ? (
        <div className="adm-rows">
          {data.requests.map((item) => {
            const phoneDigits = item.phone.replace(/\D/g, "");
            const whatsapp = `https://wa.me/${phoneDigits.startsWith("0") ? `9${phoneDigits}` : phoneDigits.startsWith("90") ? phoneDigits : `90${phoneDigits}`}`;
            return (
              <article className="adm-row" key={item.id} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                <div className="adm-row-info" style={{ minWidth: 240 }}>
                  <div className="adm-row-title"><b>{item.brand} {item.model} · {item.year}</b><span className={`adm-pill ${sellStatus[item.status]?.tone ?? "gray"}`}>{sellStatus[item.status]?.label ?? item.status}</span></div>
                  <small>{item.name} · {item.phone}{item.city ? ` · ${item.city}` : ""} · {formatDate(item.createdAt)}</small>
                  <small>{item.mileage.toLocaleString("tr-TR")} km · {[item.fuel, item.transmission, item.damage].filter(Boolean).join(" · ")}{item.expectedPrice ? ` · Beklenen: ${item.expectedPrice.toLocaleString("tr-TR")} TL` : ""}</small>
                  {item.note ? <small style={{ whiteSpace: "pre-line" }}>Not: {item.note}</small> : null}
                </div>
                <div className="adm-row-actions">
                  <a className="adm-btn light sm" href={`tel:${item.phone}`}><Phone size={14} /> Ara</a>
                  <a className="adm-btn light sm" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
                  {item.status !== "contacted" ? <button className="adm-btn ghost sm" onClick={() => void setStatus(item.id, "contacted")}>Arandı</button> : null}
                  {item.status !== "closed" ? <button className="adm-btn ghost sm" onClick={() => void setStatus(item.id, "closed")}><Check size={14} /> Kapat</button> : null}
                  <button className="adm-icon-btn" aria-label="Talebi sil" onClick={() => void remove(item.id)}><Trash2 size={15} /></button>
                </div>
              </article>
            );
          })}
        </div>
      ) : <div className="adm-empty"><Car size={28} /><h3>Henüz talep yok</h3><p>“Aracımı Sat” formundan gelen değerleme talepleri burada listelenir.</p></div>}
    </section>
  );
}

/* ------------------------------------- Yorumlar ------------------------------------- */

type AdminReview = { id: string; name: string; email: string; rating: number; comment: string; status: "approved" | "pending" | "hidden"; reply: string; createdAt: number };
const reviewStatus = { approved: { label: "Yayında", tone: "green" }, pending: { label: "Onay bekliyor", tone: "amber" }, hidden: { label: "Gizli", tone: "gray" } } as const;

export function pendingReviewCount(reviews: { status: string }[]) {
  return reviews.filter((item) => item.status === "pending").length;
}

export function ReviewsPanel({ user }: { user: User }) {
  const { data, loading, error, reload, setError } = useRemote<{ reviews: AdminReview[] }>(user, "/api/admin/reviews", { reviews: [] });
  const [replies, setReplies] = useState<Record<string, string>>({});

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      await api(user, "/api/admin/reviews", "PATCH", { id, ...body });
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Güncellenemedi.");
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Bu yorum kalıcı olarak silinsin mi?")) return;
    try {
      await api(user, `/api/admin/reviews?id=${encodeURIComponent(id)}`, "DELETE");
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Silinemedi.");
    }
  }

  return (
    <section className="adm-card">
      <Notice error={error} />
      <header className="adm-card-head"><div><h2>Müşteri yorumları <small>{pendingReviewCount(data.reviews)} onay bekliyor</small></h2></div><button className="adm-btn ghost sm" onClick={() => void reload()}>Yenile</button></header>
      {loading ? <div className="adm-empty"><p>Yükleniyor...</p></div> : data.reviews.length ? (
        <div className="adm-rows">
          {data.reviews.map((item) => (
            <article className="adm-row" key={item.id} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
              <div className="adm-row-info" style={{ minWidth: 240 }}>
                <div className="adm-row-title"><b>{item.name || "Üye"}</b><span className="adm-pill gold"><Star size={11} /> {item.rating}/5</span><span className={`adm-pill ${reviewStatus[item.status]?.tone ?? "gray"}`}>{reviewStatus[item.status]?.label ?? item.status}</span></div>
                <small>{item.email || "E-posta yok"} · {formatDate(item.createdAt)}</small>
                <small style={{ whiteSpace: "pre-line", color: "#2c2f2d" }}>{item.comment}</small>
                <div className="adm-toolbar" style={{ marginTop: 8 }}>
                  <input className="adm-search" style={{ flex: 1, minWidth: 180 }} placeholder="Yanıtınız (herkese açık)" maxLength={600} value={replies[item.id] ?? item.reply} onChange={(event) => setReplies((previous) => ({ ...previous, [item.id]: event.target.value }))} />
                  <button className="adm-btn ghost sm" onClick={() => void patch(item.id, { reply: replies[item.id] ?? item.reply })}>Yanıtı kaydet</button>
                </div>
              </div>
              <div className="adm-row-actions">
                {item.status !== "approved" ? <button className="adm-btn primary sm" onClick={() => void patch(item.id, { status: "approved" })}><Check size={14} /> Yayınla</button> : null}
                {item.status !== "hidden" ? <button className="adm-btn ghost sm" onClick={() => void patch(item.id, { status: "hidden" })}>Gizle</button> : null}
                <button className="adm-icon-btn" aria-label="Yorumu sil" onClick={() => void remove(item.id)}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="adm-empty"><Star size={28} /><h3>Henüz yorum yok</h3><p>Müşteri yorumları onayınız için burada listelenir.</p></div>}
    </section>
  );
}

/* ------------------------------------ Duyurular ------------------------------------ */

type AdminAnnouncement = { id: string; title: string; message: string; createdAt: number; emailSent: number };
type MailResult = { configured: boolean; requested: boolean; sent: number; failed: number };
const emptyAnnouncement = { title: "", brand: "", model: "", bodyType: "", minPrice: "", maxPrice: "", message: "", sendEmail: true };

type MailInfo = { configured: boolean; source: "panel" | "env" | null; host: string; port: number; user: string; from: string };

function MailSettingsCard({ user, onChanged }: { user: User; onChanged: () => void }) {
  const { data, loading, reload } = useRemote<MailInfo>(user, "/api/admin/mail-settings", { configured: false, source: null, host: "", port: 465, user: "", from: "" });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ host: "smtp.gmail.com", port: "465", user: "", pass: "", from: "" });
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const set = (key: keyof typeof form, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const open = editing || (!loading && !data.configured);

  function startEditing() {
    setForm({ host: data.host || "smtp.gmail.com", port: String(data.port || 465), user: data.user, pass: "", from: data.from });
    setEditing(true);
    setMessage(null);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy("save");
    setMessage(null);
    try {
      await api(user, "/api/admin/mail-settings", "PUT", { ...form, port: Number(form.port) });
      setForm((previous) => ({ ...previous, pass: "" }));
      setEditing(false);
      setMessage({ tone: "success", text: "E-posta ayarları doğrulandı ve kaydedildi." });
      await reload();
      onChanged();
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Kaydedilemedi." });
    } finally {
      setBusy("");
    }
  }

  async function sendTest() {
    setBusy("test");
    setMessage(null);
    try {
      const result = await api<{ to: string }>(user, "/api/admin/mail-settings", "POST");
      setMessage({ tone: "success", text: `Deneme e-postası ${result.to} adresine gönderildi. Gelen kutunuzu (ve spam klasörünü) kontrol edin.` });
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Gönderilemedi." });
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="adm-card">
      <header className="adm-card-head">
        <div><h2>E-posta ayarları {!loading ? <span className={`adm-pill ${data.configured ? "green" : "amber"}`}>{data.configured ? "Hazır" : "Kurulmadı"}</span> : null}</h2></div>
        {data.configured && !open ? <div className="adm-row-actions"><button className="adm-btn ghost sm" disabled={busy === "test"} onClick={() => void sendTest()}>{busy === "test" ? "Gönderiliyor..." : "Deneme e-postası gönder"}</button><button className="adm-btn ghost sm" onClick={startEditing}>Düzenle</button></div> : null}
      </header>
      {message ? <div className={`adm-alert ${message.tone === "success" ? "is-success" : "is-error"}`} role="status">{message.text}</div> : null}
      {!open && data.configured ? <p style={{ padding: "0 16px 16px", margin: 0, fontSize: 13.5, color: "#4a4d49" }}>Duyurular <b>{data.from || data.user}</b> adresinden gönderilir.{data.source === "env" ? " (Sunucu ayarından okunuyor.)" : ""}</p> : null}
      {open ? (
        <form className="form-grid" onSubmit={(event) => void save(event)} style={{ padding: 16 }}>
          <p className="full" style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#5d605b" }}>Duyuruları göndermek için yalnızca bu iş için açtığınız bir Gmail hesabı kullanın. Gmail hesabında 2 adımlı doğrulamayı açıp &quot;Uygulama şifreleri&quot; bölümünden 16 haneli bir şifre oluşturun; normal Gmail şifresi çalışmaz.</p>
          <label className="form-field"><span>E-posta adresi</span><input type="email" required autoComplete="off" value={form.user} onChange={(event) => set("user", event.target.value)} placeholder="ornek@gmail.com" /></label>
          <label className="form-field"><span>Uygulama şifresi</span><input type="password" autoComplete="new-password" required={!data.configured} value={form.pass} onChange={(event) => set("pass", event.target.value)} placeholder={data.configured ? "Değiştirmek için yeni şifre girin" : "16 haneli uygulama şifresi"} /></label>
          <label className="form-field"><span>Gönderen adı (isteğe bağlı)</span><input value={form.from} onChange={(event) => set("from", event.target.value)} placeholder='TML MOTORS <ornek@gmail.com>' /></label>
          <details className="form-field full"><summary style={{ cursor: "pointer", fontSize: 13 }}>Gelişmiş sunucu ayarları</summary>
            <div className="form-grid" style={{ marginTop: 10 }}>
              <label className="form-field"><span>SMTP sunucusu</span><input required value={form.host} onChange={(event) => set("host", event.target.value)} /></label>
              <label className="form-field"><span>Port</span><input type="number" required value={form.port} onChange={(event) => set("port", event.target.value)} /></label>
            </div>
          </details>
          <div className="full" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="adm-btn primary" disabled={busy === "save"}>{busy === "save" ? "Doğrulanıyor..." : "Doğrula ve kaydet"}</button>
            {editing ? <button type="button" className="adm-btn ghost" onClick={() => setEditing(false)}>Vazgeç</button> : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}

export function AnnouncementsPanel({ user }: { user: User }) {
  const { data, loading, error, reload, setError } = useRemote<{ announcements: AdminAnnouncement[]; mailConfigured: boolean }>(user, "/api/admin/announcements", { announcements: [], mailConfigured: false });
  const [form, setForm] = useState(emptyAnnouncement);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState("");
  const set = (key: keyof typeof emptyAnnouncement, value: string | boolean) => setForm((previous) => ({ ...previous, [key]: value }));

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setResult("");
    try {
      const response = await api<{ mail: MailResult }>(user, "/api/admin/announcements", "POST", form);
      const { mail } = response;
      setResult(
        !mail.requested ? "Duyuru yayınlandı. Kullanıcılara site içi bildirim olarak iletildi."
          : !mail.configured ? "Duyuru yayınlandı ve site içi bildirim olarak iletildi. E-posta ayarı yapılmadığı için e-posta gönderilmedi."
          : `Duyuru yayınlandı. ${mail.sent} kullanıcıya e-posta gönderildi${mail.failed ? `, ${mail.failed} gönderim başarısız oldu` : ""}.`,
      );
      setForm(emptyAnnouncement);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Duyuru yayınlanamadı.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Bu duyuru kalıcı olarak silinsin mi?")) return;
    try {
      await api(user, `/api/admin/announcements?id=${encodeURIComponent(id)}`, "DELETE");
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Silinemedi.");
    }
  }

  return (
    <div className="adm-stack">
      <MailSettingsCard user={user} onChanged={() => void reload()} />
      <section className="adm-card">
        <header className="adm-card-head"><div><h2>Yeni duyuru yayınla</h2></div></header>
        <Notice error={error} />
        {result ? <div className="adm-alert is-success" role="status">{result}</div> : null}
        {!data.mailConfigured && !loading ? <div className="adm-alert is-error">E-posta ayarı yapılmadığı için duyurular yalnızca site içi bildirim olarak iletilir. Yukarıdaki karttan e-postayı kurabilirsiniz.</div> : null}
        <form className="form-grid" onSubmit={(event) => void publish(event)} style={{ padding: 16 }}>
          <label className="form-field full"><span>Başlık</span><input required minLength={3} maxLength={120} value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Örn. 400-500 bin TL bandında SUV arıyoruz" /></label>
          <label className="form-field"><span>Marka (isteğe bağlı)</span><input maxLength={60} value={form.brand} onChange={(event) => set("brand", event.target.value)} /></label>
          <label className="form-field"><span>Model (isteğe bağlı)</span><input maxLength={80} value={form.model} onChange={(event) => set("model", event.target.value)} /></label>
          <label className="form-field"><span>Sınıf / kasa tipi</span><select value={form.bodyType} onChange={(event) => set("bodyType", event.target.value)}><option value="">Belirtilmedi</option>{bodyTypeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <span className="form-field" aria-hidden="true" />
          <label className="form-field"><span>En düşük fiyat (₺)</span><input type="number" inputMode="numeric" min={0} value={form.minPrice} onChange={(event) => set("minPrice", event.target.value)} /></label>
          <label className="form-field"><span>En yüksek fiyat (₺)</span><input type="number" inputMode="numeric" min={0} value={form.maxPrice} onChange={(event) => set("maxPrice", event.target.value)} /></label>
          <label className="form-field full"><span>Duyuru metni</span><textarea required minLength={10} maxLength={2000} rows={5} value={form.message} onChange={(event) => set("message", event.target.value)} placeholder="Aradığınız aracı, beklentilerinizi ve iletişim şeklinizi yazın." /></label>
          <label className="form-check full"><input type="checkbox" checked={form.sendEmail} onChange={(event) => set("sendEmail", event.target.checked)} /> Kayıtlı kullanıcılara e-posta ile de gönder (site içi bildirim her zaman gider)</label>
          <div className="full"><button className="adm-btn primary" disabled={saving}>{saving ? "Yayınlanıyor..." : "Yayınla ve bildir"}</button></div>
        </form>
      </section>
      <section className="adm-card">
        <header className="adm-card-head"><div><h2>Yayındaki duyurular <small>{data.announcements.length}</small></h2></div></header>
        {loading ? <div className="adm-empty"><p>Yükleniyor...</p></div> : data.announcements.length ? (
          <div className="adm-rows">
            {data.announcements.map((item) => (
              <article className="adm-row" key={item.id}>
                <div className="adm-row-info">
                  <div className="adm-row-title"><b>{item.title}</b>{item.emailSent ? <span className="adm-pill green">{item.emailSent} e-posta</span> : null}</div>
                  <small>{formatDate(item.createdAt)}</small>
                  <small style={{ whiteSpace: "pre-line" }}>{item.message.length > 160 ? `${item.message.slice(0, 160)}...` : item.message}</small>
                </div>
                <div className="adm-row-actions"><button className="adm-icon-btn" aria-label="Duyuruyu sil" onClick={() => void remove(item.id)}><Trash2 size={15} /></button></div>
              </article>
            ))}
          </div>
        ) : <div className="adm-empty"><Megaphone size={28} /><h3>Henüz duyuru yok</h3><p>Yayınladığınız duyurular burada listelenir.</p></div>}
      </section>
    </div>
  );
}

/* ------------------------------------ Galericiler ------------------------------------ */

type AdminDealer = { uid: string; email: string; active: boolean; businessName: string; slug: string; photoCount: number };

export function DealersPanel({ user }: { user: User }) {
  const { data, loading, error, reload, setError } = useRemote<{ dealers: AdminDealer[] }>(user, "/api/admin/dealers", { dealers: [] });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api(user, "/api/admin/dealers", "POST", { email });
      setEmail("");
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Eklenemedi.");
    } finally {
      setBusy(false);
    }
  }
  async function toggle(dealer: AdminDealer) {
    try {
      await api(user, "/api/admin/dealers", "PATCH", { uid: dealer.uid, active: !dealer.active });
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Güncellenemedi.");
    }
  }
  async function remove(dealer: AdminDealer) {
    if (!window.confirm("Galerici kaydı ve işletme bilgileri silinsin mi?")) return;
    try {
      await api(user, `/api/admin/dealers?uid=${encodeURIComponent(dealer.uid)}`, "DELETE");
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Silinemedi.");
    }
  }

  return (
    <>
      <section className="adm-card">
        <header className="adm-card-head"><div><h2>Galerici ekle <small>Üyenin e-posta adresi</small></h2></div></header>
        <form className="adm-toolbar" onSubmit={add}>
          <input className="adm-search" style={{ flex: 1, minWidth: 200 }} type="email" required placeholder="uye@ornek.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <button className="adm-btn primary" disabled={busy}>{busy ? "Ekleniyor..." : "Galerici olarak işaretle"}</button>
        </form>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6b6f6c" }}>Kişinin önce siteye üye olması gerekir. İşaretlenen üye, profilindeki “İşletme profilim” sekmesinden bilgilerini ve en fazla 5 fotoğrafı girer.</p>
      </section>
      <section className="adm-card">
        <Notice error={error} />
        <header className="adm-card-head"><div><h2>Anlaşmalı galericiler</h2></div></header>
        {loading ? <div className="adm-empty"><p>Yükleniyor...</p></div> : data.dealers.length ? (
          <div className="adm-rows">
            {data.dealers.map((dealer) => (
              <article className="adm-row" key={dealer.uid}>
                <div className="adm-row-info">
                  <div className="adm-row-title"><b>{dealer.businessName || "Profil henüz doldurulmadı"}</b><span className={`adm-pill ${dealer.active ? "green" : "gray"}`}>{dealer.active ? "Aktif" : "Pasif"}</span></div>
                  <small>{dealer.email || dealer.uid} · {dealer.photoCount} fotoğraf{dealer.slug ? ` · /galericiler/${dealer.slug}` : ""}</small>
                </div>
                <div className="adm-row-actions">
                  <button className="adm-btn ghost sm" onClick={() => void toggle(dealer)}>{dealer.active ? "Pasife al" : "Aktifleştir"}</button>
                  <button className="adm-icon-btn" aria-label="Galericiyi sil" onClick={() => void remove(dealer)}><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="adm-empty"><Building2 size={28} /><h3>Henüz galerici yok</h3><p>Yukarıdan bir üyenin e-postasını girerek galerici olarak işaretleyin.</p></div>}
      </section>
    </>
  );
}
