"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BadgeCheck, CheckCircle2, Clock, MessageCircle, ShieldCheck } from "lucide-react";

const fuels = ["Benzin", "Benzin + LPG", "Dizel", "Hibrit", "Elektrik"];
const transmissions = ["Manuel", "Otomatik", "Yarı otomatik"];
const damages = ["Hasar kaydı yok", "Boyalı parça var", "Lokal boyalı parça var", "Değişen parça var", "Tramer (hasar) kaydı var", "Ağır hasar kayıtlı", "Emin değilim"];
const exclusiveDamages = ["Hasar kaydı yok", "Emin değilim"];
const initial = { name: "", phone: "", city: "Gaziantep", brand: "", model: "", year: "", mileage: "", fuel: "", transmission: "", expectedPrice: "", note: "", website: "" };

export default function SellVehiclePage() {
  const [form, setForm] = useState(initial);
  const [damage, setDamage] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const update = (key: keyof typeof initial) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const toggleDamage = (item: string) => setDamage((previous) => {
    if (previous.includes(item)) return previous.filter((value) => value !== item);
    return exclusiveDamages.includes(item) ? [item] : [...previous.filter((value) => !exclusiveDamages.includes(value)), item];
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSending(true);
    try {
      const response = await fetch("/api/sell-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, damage, year: Number(form.year), mileage: Number(form.mileage), consent }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Talebiniz gönderilemedi.");
      setDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Talebiniz gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  const whatsappText = encodeURIComponent(`Merhaba, aracımı satmak istiyorum. ${form.brand} ${form.model} ${form.year} model, ${form.mileage} km. Ad: ${form.name}`);

  return (
    <>
      <section className="subpage-hero"><div className="container">
        <span className="eyebrow eyebrow-light">ARACIMI SAT</span>
        <h1>Aracınızın gerçek değerini birlikte belirleyelim</h1>
        <p>Formu doldurun, Gaziantep Günsev Oto AVM ekibimiz aracınızı değerlendirip size açık bir dönüş yapsın. Değerleme ücretsizdir ve bir yükümlülük doğurmaz.</p>
      </div></section>
      <section className="listing-section"><div className="container page-narrow">
        <div className="trust-row">
          <div className="trust-item"><ShieldCheck size={20} /><div><b>Ücretsiz değerleme</b><span>Hiçbir aşamada sizden ücret istenmez.</span></div></div>
          <div className="trust-item"><Clock size={20} /><div><b>Hızlı dönüş</b><span>Mesai saatlerinde talebinizi aynı gün değerlendiririz.</span></div></div>
          <div className="trust-item"><BadgeCheck size={20} /><div><b>Açık değerlendirme</b><span>Aracın durumuna göre gerekçesiyle fiyat bilgisi veririz.</span></div></div>
        </div>

        {done ? (
          <div className="form-card">
            <h2><CheckCircle2 size={22} style={{ verticalAlign: "-4px", color: "#2f7a45" }} /> Talebiniz bize ulaştı</h2>
            <p className="form-notice success">Teşekkür ederiz {form.name}. Ekibimiz verdiğiniz telefon numarasından sizinle iletişime geçecek. Dilerseniz aracınızın fotoğraflarını WhatsApp üzerinden de iletebilirsiniz.</p>
            <a className="button button-primary" href={`https://wa.me/905535781136?text=${whatsappText}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> WhatsApp ile fotoğraf gönder</a>
            <Link className="text-link" href="/araclar">İlanlarımıza göz atın <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <form className="form-card" onSubmit={submit} noValidate>
            <h2>İletişim bilgileriniz</h2>
            <div className="form-grid">
              <div className="form-field"><label htmlFor="sell-name">Ad soyad</label><input id="sell-name" required autoComplete="name" value={form.name} onChange={update("name")} maxLength={80} /></div>
              <div className="form-field"><label htmlFor="sell-phone">Telefon</label><input id="sell-phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="05xx xxx xx xx" value={form.phone} onChange={update("phone")} maxLength={24} /></div>
              <div className="form-field"><label htmlFor="sell-city">Şehir</label><input id="sell-city" autoComplete="address-level2" value={form.city} onChange={update("city")} maxLength={60} /></div>
            </div>
            <h2>Aracınız</h2>
            <div className="form-grid">
              <div className="form-field"><label htmlFor="sell-brand">Marka</label><input id="sell-brand" required placeholder="Örn. Volkswagen" value={form.brand} onChange={update("brand")} maxLength={60} /></div>
              <div className="form-field"><label htmlFor="sell-model">Model ve paket</label><input id="sell-model" required placeholder="Örn. Passat 1.6 TDI Comfortline" value={form.model} onChange={update("model")} maxLength={80} /></div>
              <div className="form-field"><label htmlFor="sell-year">Model yılı</label><input id="sell-year" required type="number" inputMode="numeric" min="1970" max={new Date().getFullYear() + 1} value={form.year} onChange={update("year")} /></div>
              <div className="form-field"><label htmlFor="sell-km">Kilometre</label><input id="sell-km" required type="number" inputMode="numeric" min="0" value={form.mileage} onChange={update("mileage")} /></div>
              <div className="form-field"><label htmlFor="sell-fuel">Yakıt</label><select id="sell-fuel" value={form.fuel} onChange={update("fuel")}><option value="">Seçiniz</option>{fuels.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="form-field"><label htmlFor="sell-trans">Vites</label><select id="sell-trans" value={form.transmission} onChange={update("transmission")}><option value="">Seçiniz</option>{transmissions.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="form-field wide"><span className="form-label">Hasar / boya durumu <small>(birden fazla seçebilirsiniz)</small></span><div className="check-grid" role="group" aria-label="Hasar ve boya durumu">{damages.map((item) => <label key={item} className={damage.includes(item) ? "check-chip is-on" : "check-chip"}><input type="checkbox" checked={damage.includes(item)} onChange={() => toggleDamage(item)} /><span>{item}</span></label>)}</div></div>
              <div className="form-field"><label htmlFor="sell-price">Beklediğiniz fiyat (₺)</label><input id="sell-price" type="number" inputMode="numeric" min="0" placeholder="İsteğe bağlı" value={form.expectedPrice} onChange={update("expectedPrice")} /><small>Boş bırakabilirsiniz; piyasa değerini birlikte konuşuruz.</small></div>
              <div className="form-field wide"><label htmlFor="sell-note">Eklemek istedikleriniz</label><textarea id="sell-note" maxLength={800} placeholder="Bakım geçmişi, değişen parçalar, ekstra donanımlar..." value={form.note} onChange={update("note")} /></div>
            </div>
            <input className="form-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={form.website} onChange={update("website")} />
            <label className="form-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> <span><Link href="/kvkk" target="_blank" className="text-link">KVKK Aydınlatma Metni</Link>&apos;ni okudum; bilgilerimin değerleme ve geri dönüş amacıyla işlenmesini kabul ediyorum.</span></label>
            {error ? <div className="form-notice error" role="alert">{error}</div> : null}
            <p className="form-notice info">TML MOTORS araç değerleme veya satış süreçlerinin hiçbir aşamasında sizden ön ödeme, kapora ya da havale istemez.</p>
            <button type="submit" className="button button-primary" disabled={sending || !consent}>{sending ? "Gönderiliyor..." : "Değerleme talebi gönder"} <ArrowRight size={16} /></button>
          </form>
        )}
      </div></section>
    </>
  );
}
