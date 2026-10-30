"use client";

import { useMemo, useState } from "react";
import { ImagePlus, MousePointerClick, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { AdCreative } from "@/components/ad-slot";
import { EditorSheet } from "@/components/admin/editor-sheet";
import { adPlacements, getAdPlacement, type AdPlacement, type AdShape } from "@/lib/ad-placements";
import { adStatusLabels, emptyAdDraft, getAdStatus, shapeLabels, type AdDraft, type AdminAd, type AdStatus } from "@/lib/admin-types";

const statusTone: Record<AdStatus, string> = { live: "green", scheduled: "blue", expired: "gray", paused: "amber" };

function PlacementWireframe({ placement }: { placement: AdPlacement }) {
  return (
    <span className={`wf wf-page-${placement.page}`} aria-hidden="true">
      <i className="wf-header" />
      <i className="wf-hero" />
      <i className="wf-line l1" /><i className="wf-line l2" /><i className="wf-line l3" />
      <i className="wf-card c1" /><i className="wf-card c2" /><i className="wf-card c3" />
      <i className={`wf-zone wf-${placement.position} wf-${placement.shape}`} />
    </span>
  );
}

function PlacementPicker({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="adm-pl-grid">
      {adPlacements.map((placement) => {
        const active = selected.includes(placement.id);
        return (
          <button type="button" key={placement.id} className={active ? "adm-pl is-selected" : "adm-pl"} onClick={() => onToggle(placement.id)} aria-pressed={active}>
            <PlacementWireframe placement={placement} />
            <span className="adm-pl-copy">
              <b>{placement.label}</b>
              <small>{shapeLabels[placement.shape]} · {placement.width}×{placement.height} px</small>
              <small>{placement.description}</small>
            </span>
            <span className="adm-pl-check">{active ? "Seçili" : "Seç"}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AdManager({ ads, draft, setDraft, saving, uploading, error, success, onSave, onDelete, onUpload }: {
  ads: AdminAd[];
  draft: AdDraft | null;
  setDraft: (draft: AdDraft | null) => void;
  saving: boolean;
  uploading: boolean;
  error: string;
  success: string;
  onSave: (draft: AdDraft) => void;
  onDelete: (id: string) => void;
  onUpload: (file: File) => Promise<string | null>;
}) {
  const [filter, setFilter] = useState<"all" | AdStatus>("all");
  const today = new Date().toISOString().slice(0, 10);
  const counts = useMemo(() => {
    const result: Record<AdStatus, number> = { live: 0, scheduled: 0, expired: 0, paused: 0 };
    ads.forEach((ad) => { result[getAdStatus(ad, today)] += 1; });
    return result;
  }, [ads, today]);
  const visible = ads.filter((ad) => filter === "all" || getAdStatus(ad, today) === filter);
  const liveCounts = ads.filter((ad) => getAdStatus(ad, today) === "live").flatMap((ad) => ad.placements).reduce<Record<string, number>>((acc, id) => ({ ...acc, [id]: (acc[id] ?? 0) + 1 }), {});
  const occupied = new Set(Object.keys(liveCounts));

  const renderEditor = (draft: AdDraft) => {
    const selected = draft.placements.map(getAdPlacement).filter((item): item is AdPlacement => Boolean(item));
    const previewShapes = Array.from(new Set(selected.map((item) => item.shape)));
    const mixedShapes = previewShapes.length > 1;
    const sizes = Array.from(new Set(selected.map((item) => `${item.width}×${item.height}`)));
    const toggle = (id: string) => setDraft({ ...draft, placements: draft.placements.includes(id) ? draft.placements.filter((item) => item !== id) : [...draft.placements, id] });
    const set = <K extends keyof AdDraft>(key: K, value: AdDraft[K]) => setDraft({ ...draft, [key]: value });

    return (
      <EditorSheet title={draft.id ? "Reklamı düzenle" : "Yeni reklam"} subtitle={draft.id ? draft.business : "Konumu seçin, içeriği girin, kaydedin."} onClose={() => setDraft(null)} error={error} success={success}
        primaryAction={<button type="button" className="adm-btn primary" disabled={saving || uploading} onClick={() => onSave(draft)}><Save size={16} /> {saving ? "Kaydediliyor..." : draft.id ? "Değişiklikleri kaydet" : "Reklamı kaydet"}</button>}>
      <div className="adm-editor-layout">
        <div className="adm-stack">
          <section className="adm-card">
            <header className="adm-card-head"><div><span className="adm-step">1</span><h2>Reklam nerede görünsün?</h2><p>Sitenin hangi sayfasında ve hangi biçimde gösterileceğini seçin. Birden fazla konum seçebilirsiniz.</p></div></header>
            <PlacementPicker selected={draft.placements} onToggle={toggle} />
            {mixedShapes ? <p className="adm-note is-warn">Yatay ve dikey konumları birlikte seçtiniz. Tek görsel her biçime uymaz ve kırpılabilir; her biçim için ayrı reklam oluşturmanız önerilir.</p> : null}
          </section>

          <section className="adm-card">
            <header className="adm-card-head"><div><span className="adm-step">2</span><h2>Sponsor ve içerik</h2><p>Banner görseli yüklerseniz yalnızca görsel gösterilir. Görsel yoksa başlık ve açıklamadan şık bir metin reklamı oluşturulur.</p></div></header>
            <div className="adm-grid">
              <label className="adm-field">İşletme / sponsor adı<input value={draft.business} onChange={(event) => set("business", event.target.value)} placeholder="Örn. Güven Oto Ekspertiz" /></label>
              <label className="adm-field">Yönlendirme bağlantısı<input value={draft.url} onChange={(event) => set("url", event.target.value)} placeholder="https://..." inputMode="url" /></label>
              <label className="adm-field">Reklam başlığı<input value={draft.title} onChange={(event) => set("title", event.target.value)} placeholder="Örn. Ücretsiz ön ekspertiz" /></label>
              <label className="adm-field">Kısa açıklama<input value={draft.description} onChange={(event) => set("description", event.target.value)} placeholder="İsteğe bağlı" /></label>
            </div>
            <div className="adm-field">Banner görseli
              {selected.length ? <small className="adm-hint">Önerilen ölçü: {sizes.join(" · ")} px (JPG, PNG ya da WebP, en fazla 8 MB){selected.some((item) => item.shape !== "tall") ? ` · Yan yana yayınlanırsa: ${selected.filter((item) => item.shape !== "tall").slice(0, 1).map((item) => `2 reklam ${item.width / 2}×${item.height}, 3 reklam ${Math.round(item.width / 3)}×${item.height}, 4 reklam ${item.width / 4}×${item.height}`)} px` : ""}</small> : <small className="adm-hint">Önce yukarıdan konum seçin; önerilen ölçü burada görünür.</small>}
              {draft.imageUrl ? (
                <span className="adm-image-preview"><img src={draft.imageUrl} alt="Banner görseli" /><button type="button" className="adm-icon-btn danger" aria-label="Görseli kaldır" onClick={() => set("imageUrl", "")}><X size={16} /></button></span>
              ) : (
                <span className="adm-upload"><ImagePlus size={22} />{uploading ? "Görsel yükleniyor..." : "Banner görselini seç"}
                  <input type="file" accept="image/*" disabled={uploading} onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void onUpload(file).then((url) => { if (url) set("imageUrl", url); });
                  }} />
                </span>
              )}
            </div>
          </section>

          <section className="adm-card">
            <header className="adm-card-head"><div><span className="adm-step">3</span><h2>Yayın ve sözleşme</h2><p>Tarih aralığı dolunca reklam otomatik olarak yayından kalkar.</p></div></header>
            <div className="adm-grid">
              <label className="adm-field">Başlangıç tarihi<input type="date" value={draft.startDate} onChange={(event) => set("startDate", event.target.value)} /></label>
              <label className="adm-field">Bitiş tarihi<input type="date" value={draft.endDate} min={draft.startDate || undefined} onChange={(event) => set("endDate", event.target.value)} /></label>
              <label className="adm-field">Öncelik (0-100)<input type="number" min={0} max={100} value={draft.priority} onChange={(event) => set("priority", Number(event.target.value))} /><small className="adm-hint">Aynı konuma birden fazla reklam girerseniz yüksek öncelikli olan gösterilir; eşitlerde sırayla değişir.</small></label>
              <label className="adm-check"><input type="checkbox" checked={draft.active} onChange={(event) => set("active", event.target.checked)} /> Reklam yayında olsun</label>
            </div>
            <label className="adm-field">Özel not (yalnızca siz görürsünüz)<textarea rows={3} value={draft.sponsorNote} onChange={(event) => set("sponsorNote", event.target.value)} placeholder="Ücret, ödeme durumu, sponsor iletişim bilgisi…" /></label>
          </section>
        </div>

        <aside className="adm-preview-panel">
          <section className="adm-card">
            <header className="adm-card-head"><div><h2>Canlı önizleme</h2><p>Sitede görüneceği hâli.</p></div></header>
            {previewShapes.length ? previewShapes.map((shape: AdShape) => {
              const reference = selected.find((item) => item.shape === shape)!;
              return (
                <div className={`adm-preview adm-preview-${shape}`} key={shape}>
                  <small>{shapeLabels[shape]}</small>
                  <AdCreative ad={draft} shape={shape} ratio={draft.imageUrl ? `${reference.width} / ${reference.height}` : undefined} />
                </div>
              );
            }) : <p className="adm-empty-text">Önizleme için bir konum seçin.</p>}
          </section>
        </aside>
      </div>
      </EditorSheet>
    );
  };

  return (
    <>
    {draft ? renderEditor(draft) : null}
    <div className="adm-stack">
      <section className="adm-card">
        <header className="adm-card-head">
          <div><h2>Sitedeki reklam konumları</h2><p>Yatay konumlara en fazla 4 reklam eklenebilir: 1 reklam tam genişlikte, 2-4 reklam eşit genişlikte yan yana görünür. Dikey konumlarda tek reklam gösterilir.</p></div>
        </header>
        <div className="adm-slot-map">
          {adPlacements.map((placement) => (
            <button type="button" key={placement.id} className={occupied.has(placement.id) ? "adm-slot is-live" : "adm-slot"} onClick={() => setDraft({ ...emptyAdDraft, placements: [placement.id] })}>
              <PlacementWireframe placement={placement} />
              <b>{placement.label}</b>
              <small>{placement.width}×{placement.height} px</small>
              <span className={`adm-pill ${occupied.has(placement.id) ? "green" : "gray"}`}>{occupied.has(placement.id) ? (placement.shape === "tall" ? "Dolu" : `${Math.min(liveCounts[placement.id], 4)}/4 reklam yayında`) : "Boş · reklam ekle"}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="adm-card">
        <header className="adm-card-head"><div><h2>Tüm reklamlar <small>{ads.length}</small></h2></div>
          <button type="button" className="adm-btn primary" onClick={() => setDraft({ ...emptyAdDraft })}><Plus size={16} /> Yeni reklam</button>
        </header>
        <div className="adm-chips">
          {([["all", "Tümü", ads.length], ["live", "Yayında", counts.live], ["scheduled", "Planlandı", counts.scheduled], ["paused", "Durduruldu", counts.paused], ["expired", "Süresi doldu", counts.expired]] as const).map(([key, label, count]) => (
            <button type="button" key={key} className={filter === key ? "adm-chip is-active" : "adm-chip"} onClick={() => setFilter(key)}>{label} <b>{count}</b></button>
          ))}
        </div>
        {visible.length ? (
          <div className="adm-ad-list">
            {visible.map((ad) => {
              const status = getAdStatus(ad, today);
              return (
                <article className="adm-ad-row" key={ad.id}>
                  <div className="adm-ad-thumb">{ad.imageUrl ? <img src={ad.imageUrl} alt="" /> : <span>{(ad.business || "?").slice(0, 1)}</span>}</div>
                  <div className="adm-ad-info">
                    <div className="adm-ad-title"><b>{ad.business}</b><span className={`adm-pill ${statusTone[status]}`}>{adStatusLabels[status]}</span></div>
                    <p>{ad.title || "Görsel banner"}</p>
                    <div className="adm-tags">{ad.placements.map((id) => <span key={id}>{getAdPlacement(id)?.label ?? id}</span>)}</div>
                    <small>{ad.startDate || ad.endDate ? `${ad.startDate || "—"} → ${ad.endDate || "süresiz"}` : "Süresiz"} · <MousePointerClick size={12} /> {ad.clicks ?? 0} tıklama{ad.sponsorNote ? ` · Not: ${ad.sponsorNote.slice(0, 70)}` : ""}</small>
                  </div>
                  <div className="adm-row-actions">
                    <button type="button" className="adm-btn ghost sm" onClick={() => setDraft({ ...ad })}><Pencil size={14} /> Düzenle</button>
                    <button type="button" className="adm-icon-btn danger" aria-label="Reklamı sil" onClick={() => onDelete(ad.id)}><Trash2 size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <p className="adm-empty-text">{ads.length ? "Bu durumda reklam yok." : "Henüz reklam eklenmedi. Sponsorunuzun görseli ve bağlantısıyla ilk reklamı oluşturun."}</p>}
      </section>
    </div>
    </>
  );
}
