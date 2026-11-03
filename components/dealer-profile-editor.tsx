"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { ArrowUpRight, Camera, Save, X } from "lucide-react";
import { Loading } from "@/components/loading";
import { uploadImageToR2 } from "@/lib/r2-upload";

type Dealer = {
  businessName: string; slug: string; about: string; phone: string; city: string; address: string;
  sahibindenUrl: string; arabamUrl: string; instagramUrl: string; facebookUrl: string; youtubeUrl: string; websiteUrl: string;
  photos: string[];
};

const emptyDealer: Dealer = { businessName: "", slug: "", about: "", phone: "", city: "Gaziantep", address: "", sahibindenUrl: "", arabamUrl: "", instagramUrl: "", facebookUrl: "", youtubeUrl: "", websiteUrl: "", photos: [] };
const MAX_PHOTOS = 5;

export function useIsDealer(user: User | null): boolean {
  const [isDealer, setIsDealer] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (!user) {
      setIsDealer(false);
      return;
    }
    void (async () => {
      try {
        const response = await fetch("/api/dealer", { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
        const data = await response.json() as { isDealer?: boolean };
        if (mounted) setIsDealer(Boolean(data.isDealer));
      } catch {
        if (mounted) setIsDealer(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);
  return isDealer;
}

async function uploadDealerPhoto(file: File, user: User): Promise<string> {
  return uploadImageToR2(file, "dealer", user);
}

export function DealerProfileEditor({ user }: { user: User }) {
  const [dealer, setDealer] = useState<Dealer>(emptyDealer);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const response = await fetch("/api/dealer", { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
        const data = await response.json() as { dealer?: Partial<Dealer> | null };
        if (mounted && data.dealer) setDealer({ ...emptyDealer, ...data.dealer });
      } catch {
        if (mounted) setMessage({ type: "error", text: "İşletme bilgileri alınamadı." });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const update = (key: keyof Dealer) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDealer((previous) => ({ ...previous, [key]: event.target.value }));

  async function addPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const room = MAX_PHOTOS - dealer.photos.length;
    if (room <= 0) {
      setMessage({ type: "error", text: `En fazla ${MAX_PHOTOS} fotoğraf ekleyebilirsiniz.` });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, room)) urls.push(await uploadDealerPhoto(file, user));
      setDealer((previous) => ({ ...previous, photos: [...previous.photos, ...urls].slice(0, MAX_PHOTOS) }));
      if (files.length > room) setMessage({ type: "error", text: `Yalnızca ${room} fotoğraf eklendi; sınır ${MAX_PHOTOS}.` });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Fotoğraf yüklenemedi." });
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/dealer", {
        method: "PUT",
        headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(dealer),
      });
      const result = await response.json() as { error?: string; dealer?: Dealer };
      if (!response.ok) throw new Error(result.error ?? "Profil kaydedilemedi.");
      if (result.dealer) setDealer((previous) => ({ ...previous, ...result.dealer }));
      setMessage({ type: "success", text: "İşletme profiliniz kaydedildi ve yayında." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Profil kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="pf-card pf-panel"><Loading label="İşletme profili yükleniyor" /></section>;

  return (
    <section className="pf-card pf-panel" role="tabpanel" aria-label="İşletme profilim">
      <form className="form-card" style={{ border: 0, padding: 0 }} onSubmit={save}>
        <p className="form-notice info">Hesabınız anlaşmalı galerici olarak etkinleştirildi. Aşağıdaki bilgiler herkese açık işletme sayfanızda görünür. {dealer.slug ? <Link className="text-link" href={`/galericiler/${dealer.slug}`} target="_blank">Sayfamı görüntüle <ArrowUpRight size={13} /></Link> : null}</p>
        <h2>İşletme bilgileri</h2>
        <div className="form-grid">
          <div className="form-field"><label htmlFor="d-name">İşletme adı</label><input id="d-name" required maxLength={80} value={dealer.businessName} onChange={update("businessName")} /></div>
          <div className="form-field"><label htmlFor="d-phone">Telefon</label><input id="d-phone" type="tel" maxLength={24} value={dealer.phone} onChange={update("phone")} /></div>
          <div className="form-field"><label htmlFor="d-city">Şehir</label><input id="d-city" maxLength={60} value={dealer.city} onChange={update("city")} /></div>
          <div className="form-field"><label htmlFor="d-address">Adres</label><input id="d-address" maxLength={200} value={dealer.address} onChange={update("address")} /></div>
          <div className="form-field wide"><label htmlFor="d-about">İşletme hakkında</label><textarea id="d-about" maxLength={1500} value={dealer.about} onChange={update("about")} placeholder="İşletmenizi, çalışma prensiplerinizi ve uzmanlık alanlarınızı anlatın." /><small>{dealer.about.length}/1500</small></div>
        </div>
        <h2>Bağlantılar</h2>
        <div className="form-grid">
          <div className="form-field"><label htmlFor="d-sahibinden">sahibinden.com profili</label><input id="d-sahibinden" type="url" placeholder="https://" value={dealer.sahibindenUrl} onChange={update("sahibindenUrl")} /></div>
          <div className="form-field"><label htmlFor="d-arabam">arabam.com profili</label><input id="d-arabam" type="url" placeholder="https://" value={dealer.arabamUrl} onChange={update("arabamUrl")} /></div>
          <div className="form-field"><label htmlFor="d-instagram">Instagram</label><input id="d-instagram" type="url" placeholder="https://instagram.com/..." value={dealer.instagramUrl} onChange={update("instagramUrl")} /></div>
          <div className="form-field"><label htmlFor="d-facebook">Facebook</label><input id="d-facebook" type="url" placeholder="https://facebook.com/..." value={dealer.facebookUrl} onChange={update("facebookUrl")} /></div>
          <div className="form-field"><label htmlFor="d-youtube">YouTube</label><input id="d-youtube" type="url" placeholder="https://youtube.com/..." value={dealer.youtubeUrl} onChange={update("youtubeUrl")} /></div>
          <div className="form-field"><label htmlFor="d-web">Web sitesi</label><input id="d-web" type="url" placeholder="https://" value={dealer.websiteUrl} onChange={update("websiteUrl")} /></div>
        </div>
        <h2>İşletme fotoğrafları ({dealer.photos.length}/{MAX_PHOTOS})</h2>
        <div className="dealer-photo-edit">
          {dealer.photos.map((photo, index) => (
            <figure key={photo}><img src={photo} alt={`İşletme fotoğrafı ${index + 1}`} /><button type="button" aria-label="Fotoğrafı kaldır" onClick={() => setDealer((previous) => ({ ...previous, photos: previous.photos.filter((item) => item !== photo) }))}><X size={14} /></button></figure>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
        <div><button type="button" className="inline-control" onClick={() => fileRef.current?.click()} disabled={uploading || dealer.photos.length >= MAX_PHOTOS}><Camera size={15} /> {uploading ? "Yükleniyor..." : "Fotoğraf ekle"}</button></div>
        {message ? <div className={`form-notice ${message.type}`} role="status">{message.text}</div> : null}
        <button type="submit" className="button button-primary" disabled={saving || uploading}><Save size={16} /> {saving ? "Kaydediliyor..." : "Profili kaydet"}</button>
      </form>
    </section>
  );
}
