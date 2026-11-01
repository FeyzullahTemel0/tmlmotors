"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ImagePlus, MousePointerClick, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { AdCreative } from "@/components/ad-slot";
import { EditorSheet } from "@/components/admin/editor-sheet";
import { getAdPlacement, type AdPage, type AdPlacement, type AdShape } from "@/lib/ad-placements";
import { adStatusLabels, emptyAdDraft, getAdStatus, shapeLabels, type AdDraft, type AdminAd, type AdStatus } from "@/lib/admin-types";

const statusTone: Record<AdStatus, string> = { live: "green", scheduled: "blue", expired: "gray", paused: "amber" };

// Yüklenen görselin oranı seçili konumun oranına uymuyorsa görsel küçülür; yönetici önceden uyarılır.
function ImageFitCheck({ imageUrl, placements }: { imageUrl: string; placements: AdPlacement[] }) {
  const [ratio, setRatio] = useState<number | null>(null);
  useEffect(() => {
    setRatio(null);
    if (!imageUrl) return;
    const image = new window.Image();
    image.onload = () => setRatio(image.naturalWidth / image.naturalHeight);
    image.src = imageUrl;
  }, [imageUrl]);
  if (!ratio) return null;

  const bad = placements.filter((item) => {
    const target = item.width / item.height;
    return Math.max(ratio / target, target / ratio) > 1.6;
  });
  if (!bad.length) return <p className="adm-note">Görselin oranı seçilen konumlara uygun.</p>;
  const isWideImage = ratio > 1.2;
  return (
    <p className="adm-note is-warn">
      Bu görsel {isWideImage ? "yatay" : "dikey"} hazırlanmış; şu konumlarda küçük görünür: {bad.map((item) => `${item.label} (${item.width}×${item.height})`).join(", ")}.
      {isWideImage ? " Yatay görseli dikey konumda kullanmak yerine yatay bir konum (ana sayfa banner'ları, liste üstü, yazı sonu vb.) seçin ya da dikey konum için 240×480 ölçüsünde ayrı bir görsel hazırlayın." : " Dikey görseli yatay konumda kullanmak yerine dikey konum seçin ya da yatay konum için ayrı görsel hazırlayın."}
    </p>
  );
}

type MapBlock = { label: string; tone?: "dark" | "header" };
type MapRow = { block: MapBlock } | { zone: string } | { main: MapBlock[]; side: string };
type PageMapDef = { page: AdPage; label: string; url: string; note?: string; rows: MapRow[] };

const footerRows: MapRow[] = [{ zone: "footer-strip" }, { block: { label: "Alt bilgi (footer)", tone: "dark" } }];
const headerRow: MapRow = { block: { label: "Menü", tone: "header" } };

// Her sayfanın şematik görünümü; alanlar sitedeki gerçek sırayla dizilidir.
const pageMaps: PageMapDef[] = [
  { page: "home", label: "Ana sayfa", url: "tmlmotors.com", rows: [
    headerRow,
    { block: { label: "Karşılama alanı", tone: "dark" } },
    { block: { label: "İşletme bilgileri" } },
    { zone: "home-top" },
    { block: { label: "Son blog yazısı" } },
    { block: { label: "Yayındaki araçlar", tone: "dark" } },
    { block: { label: "Hizmetler" } },
    { zone: "home-middle" },
    { block: { label: "Yaklaşım ve sık sorulan sorular" } },
    { zone: "home-bottom" },
    { block: { label: "İletişim bandı", tone: "dark" } },
    ...footerRows,
  ] },
  { page: "listing", label: "Araçlar", url: "/araclar ve /hasarli-araclar", note: "Aynı konumlar Araçlar ve Hasarlı Araçlar sayfalarında birlikte görünür.", rows: [
    headerRow,
    { block: { label: "Sayfa başlığı", tone: "dark" } },
    { zone: "listing-top" },
    { main: [{ label: "Arama ve filtreler" }, { label: "İlan kartları" }, { label: "Aracımı sat bandı" }], side: "listing-side" },
    ...footerRows,
  ] },
  { page: "vehicle", label: "İlan detayı", url: "/araclar/ilan-adi", rows: [
    headerRow,
    { main: [{ label: "Fotoğraf galerisi" }, { label: "Fiyat ve satıcı bilgisi" }, { label: "Açıklama, özellikler, hasar şeması" }], side: "vehicle-side" },
    { zone: "vehicle-bottom" },
    ...footerRows,
  ] },
  { page: "blog", label: "Blog listesi", url: "/blog", rows: [
    headerRow,
    { block: { label: "Sayfa başlığı", tone: "dark" } },
    { zone: "blog-top" },
    { block: { label: "Kategori filtreleri" } },
    { block: { label: "Blog yazıları" } },
    ...footerRows,
  ] },
  { page: "article", label: "Blog yazısı", url: "/blog/yazi-adi", rows: [
    headerRow,
    { main: [{ label: "Yazı görseli" }, { label: "Yazı metni" }], side: "article-side" },
    { zone: "article-bottom" },
    { block: { label: "Diğer yazılar" } },
    ...footerRows,
  ] },
];

const shortLabel = (placement: AdPlacement) => placement.label.split(" · ").pop() ?? placement.label;

function MapZone({ id, selected, counts, onPick }: { id: string; selected: string[]; counts: Record<string, number>; onPick: (id: string) => void }) {
  const placement = getAdPlacement(id);
  if (!placement) return null;
  const active = selected.includes(id);
  const live = counts[id] ?? 0;
  const status = live ? (placement.shape === "tall" ? "Dolu" : `${Math.min(live, 4)}/4 dolu`) : "Boş";
  return (
    <button type="button" className={`pm-zone pm-${placement.shape}${active ? " is-selected" : ""}${live ? " is-live" : ""}`} onClick={() => onPick(id)} aria-pressed={active} aria-label={`${placement.label}, ${placement.width}×${placement.height}, ${status}`}>
      <span className="pm-zone-check" aria-hidden="true">{active ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}</span>
      <b>{shortLabel(placement)}</b>
      <small>{placement.width}×{placement.height}</small>
      <em className={live ? "is-live" : ""}>{status}</em>
    </button>
  );
}

function MapBlockView({ block }: { block: MapBlock }) {
  return <div className={`pm-block${block.tone ? ` is-${block.tone}` : ""}`}>{block.label}</div>;
}

function PlacementMap({ selected, counts, onPick, showInfo }: { selected: string[]; counts: Record<string, number>; onPick: (id: string) => void; showInfo?: boolean }) {
  const firstPage = pageMaps.find((item) => selected.some((id) => getAdPlacement(id)?.page === item.page))?.page ?? "home";
  const [page, setPage] = useState<AdPage>(firstPage);
  const [focus, setFocus] = useState<string | null>(selected[selected.length - 1] ?? null);
  const current = pageMaps.find((item) => item.page === page) ?? pageMaps[0];
  const focused = focus ? getAdPlacement(focus) : undefined;
  const pick = (id: string) => { setFocus(id); onPick(id); };
  const countFor = (item: PageMapDef) => {
    const ids = new Set(item.rows.flatMap((row) => "zone" in row ? [row.zone] : "side" in row ? [row.side] : []));
    return selected.filter((id) => ids.has(id) && id !== "footer-strip").length + (item.page === "home" && selected.includes("footer-strip") ? 1 : 0);
  };

  return (
    <div className="pm">
      <div className="pm-tabs" role="tablist" aria-label="Sayfa seçin">
        {pageMaps.map((item) => {
          const count = countFor(item);
          return (
            <button type="button" role="tab" aria-selected={item.page === page} key={item.page} className={item.page === page ? "pm-tab is-active" : "pm-tab"} onClick={() => setPage(item.page)}>
              {item.label}{count ? <i>{count}</i> : null}
            </button>
          );
        })}
      </div>
      <div className="pm-page">
        <div className="pm-url"><span /><span /><span /><small>{current.url}</small></div>
        <div className="pm-stack">
          {current.rows.map((row, index) => {
            if ("zone" in row) return <MapZone key={index} id={row.zone} selected={selected} counts={counts} onPick={pick} />;
            if ("block" in row) return <MapBlockView key={index} block={row.block} />;
            return (
              <div className="pm-split" key={index}>
                <div className="pm-split-main">{row.main.map((block) => <MapBlockView key={block.label} block={block} />)}</div>
                <MapZone id={row.side} selected={selected} counts={counts} onPick={pick} />
              </div>
            );
          })}
        </div>
        <p className="pm-hint">{current.note ?? "Renkli kesikli alanlar reklam konumlarıdır. Eklemek için dokunun."}</p>
      </div>
      {showInfo ? (
        <div className="pm-info" aria-live="polite">
          {focused ? (
            <>
              <b>{focused.label}</b>
              <span>{shapeLabels[focused.shape]} · önerilen görsel {focused.width}×{focused.height} px</span>
              <p>{focused.description}</p>
            </>
          ) : <p>Bilgi görmek ve seçmek için haritadaki alanlara dokunun.</p>}
        </div>
      ) : null}
    </div>
  );
}

function PlacementPicker({ selected, onToggle, counts }: { selected: string[]; onToggle: (id: string) => void; counts: Record<string, number> }) {
  return (
    <>
      <PlacementMap selected={selected} counts={counts} onPick={onToggle} showInfo />
      <div className="pm-chosen">
        <b>Seçilen konumlar <span>{selected.length}</span></b>
        {selected.length ? (
          <div>
            {selected.map((id) => (
              <button type="button" key={id} onClick={() => onToggle(id)} aria-label={`${getAdPlacement(id)?.label ?? id} konumunu kaldır`}>
                {getAdPlacement(id)?.label ?? id}<X size={14} />
              </button>
            ))}
          </div>
        ) : <small>Henüz konum seçilmedi. Yukarıdaki haritadan en az bir alan seçin.</small>}
      </div>
    </>
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
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
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
            <PlacementPicker selected={draft.placements} onToggle={toggle} counts={liveCounts} />
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
              {draft.imageUrl && selected.length ? <ImageFitCheck imageUrl={draft.imageUrl} placements={selected} /> : null}
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
          <div><h2>Sitedeki reklam konumları</h2><p>Sayfayı seçin, boş bir alana dokunun ve o alan için reklam ekleyin. Yatay konumlara en fazla 4 reklam eklenebilir (2-4 reklam eşit genişlikte yan yana görünür). Dikey konumlarda tek reklam gösterilir.</p></div>
        </header>
        <PlacementMap selected={[]} counts={liveCounts} onPick={(id) => setDraft({ ...emptyAdDraft, placements: [id] })} />
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
                    {confirmId === ad.id ? (
                      <div className="adm-confirm" role="alertdialog" aria-label="Silme onayı">
                        <span>Bu reklam silinsin mi?</span>
                        <button type="button" className="adm-btn danger sm" disabled={saving} onClick={() => { setConfirmId(null); onDelete(ad.id); }}><Trash2 size={14} /> Evet, sil</button>
                        <button type="button" className="adm-btn ghost sm" onClick={() => setConfirmId(null)}>Vazgeç</button>
                      </div>
                    ) : (
                      <>
                        <button type="button" className="adm-btn ghost sm" onClick={() => setDraft({ ...ad })}><Pencil size={14} /> Düzenle</button>
                        <button type="button" className="adm-btn danger-ghost sm" aria-label="Reklamı sil" onClick={() => setConfirmId(ad.id)}><Trash2 size={14} /> Sil</button>
                      </>
                    )}
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
