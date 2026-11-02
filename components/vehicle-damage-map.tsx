"use client";

import { useMemo, useState } from "react";
import type { VehicleDamagePart, VehicleDamageStatus, VehicleTire } from "@/lib/vehicle-types";
import { tireSizeSuggestions, tireStatusSuggestions, type TirePositionKey } from "@/lib/vehicle-features";
import { usePreferences } from "@/lib/i18n/preferences-context";
import type { TranslationKey } from "@/lib/i18n/translations";

type PartShape = { id: string; label: string; d: string; cx: number; cy: number; mirror?: boolean };

// Sol taraf parçaları çizilir, sağ taraf aynı çizimin yansımasıdır (genişlik 340).
const VIEW_WIDTH = 340;
const leftSide = [
  { position: "front", kind: "Fender", label: "ön çamurluk", d: "M34 66 Q60 60 80 66 L100 76 L100 142 L36 142 Q28 104 34 66 Z", cx: 72, cy: 112 },
  { position: "front", kind: "Door", label: "ön kapı", d: "M36 146 L100 146 L100 228 L38 228 Q34 188 36 146 Z", cx: 50, cy: 187 },
  { position: "rear", kind: "Door", label: "arka kapı", d: "M38 232 L100 232 L100 300 L38 300 Q34 266 38 232 Z", cx: 50, cy: 266 },
  { position: "rear", kind: "Fender", label: "arka çamurluk", d: "M38 304 L100 304 L100 374 Q86 386 62 386 Q40 384 36 356 Q34 330 38 304 Z", cx: 74, cy: 352 },
] as const;

const sideNames = { left: "Sol", right: "Sağ" } as const;

const tireShapes: { id: TirePositionKey; cx: number; cy: number }[] = [
  { id: "frontLeft", cx: 28, cy: 112 },
  { id: "frontRight", cx: VIEW_WIDTH - 28, cy: 112 },
  { id: "rearLeft", cx: 28, cy: 322 },
  { id: "rearRight", cx: VIEW_WIDTH - 28, cy: 322 },
];

const parts: PartShape[] = [
  { id: "frontBumper", label: "Ön tampon", d: "M118 18 L222 18 Q227 18 227 23 L227 45 Q227 50 222 50 L118 50 Q113 50 113 45 L113 23 Q113 18 118 18 Z", cx: 170, cy: 34 },
  { id: "hood", label: "Kaput", d: "M126 58 Q170 49 214 58 L226 142 Q170 134 114 142 Z", cx: 170, cy: 100 },
  { id: "roof", label: "Tavan", d: "M128 232 Q170 228 212 232 L212 290 Q170 294 128 290 Z", cx: 170, cy: 261 },
  { id: "trunk", label: "Bagaj kapağı", d: "M120 364 Q170 370 220 364 L222 388 Q170 391 118 388 Z", cx: 170, cy: 377 },
  { id: "rearBumper", label: "Arka tampon", d: "M118 394 L222 394 Q227 394 227 399 L227 417 Q227 422 222 422 L118 422 Q113 422 113 417 L113 399 Q113 394 118 394 Z", cx: 170, cy: 408 },
  ...(["left", "right"] as const).flatMap((side) => leftSide.map((part): PartShape => ({
    id: `${part.position}${side === "left" ? "Left" : "Right"}${part.kind}`,
    label: `${sideNames[side]} ${part.label}`,
    d: part.d,
    cx: side === "left" ? part.cx : VIEW_WIDTH - part.cx,
    cy: part.cy,
    mirror: side === "right",
  }))),
];

const statusLabels: Record<VehicleDamageStatus, string> = {
  original: "Orijinal",
  localPaint: "Lokal boyalı",
  painted: "Boyalı",
  changed: "Değişen",
};

const statusColors: Record<VehicleDamageStatus, string> = {
  original: "#6f9f7c",
  localPaint: "#ff9d4d",
  painted: "#3b7cc4",
  changed: "#ff5b36",
};

const statusLetters: Record<VehicleDamageStatus, string> = { original: "", localPaint: "L", painted: "B", changed: "D" };

const statuses: VehicleDamageStatus[] = ["original", "localPaint", "painted", "changed"];

export const damagePartIds = parts.map((part) => part.id);

export function VehicleDamageMap({
  value = [],
  onChange,
  tires = [],
  onTiresChange,
}: {
  value?: VehicleDamagePart[];
  onChange?: (parts: VehicleDamagePart[]) => void;
  tires?: VehicleTire[];
  onTiresChange?: (tires: VehicleTire[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { t } = usePreferences();
  const statusById = useMemo(() => new Map(value.map((part) => [part.id, part.status])), [value]);

  function statusText(status: VehicleDamageStatus): string {
    const keys: Record<VehicleDamageStatus, TranslationKey> = { original: "dmgOriginal", localPaint: "dmgLocalPaint", painted: "dmgPainted", changed: "dmgChanged" };
    return t(keys[status]);
  }

  function partText(part: PartShape): string {
    const topParts: Record<string, TranslationKey> = { frontBumper: "partFrontBumper", hood: "partHood", roof: "partRoof", trunk: "partTrunk", rearBumper: "partRearBumper" };
    const topKey = topParts[part.id];
    if (topKey) return t(topKey);
    const side = part.id.includes("Left") ? t("sideLeft") : t("sideRight");
    const kindKey: TranslationKey = part.id.endsWith("Fender")
      ? part.id.startsWith("front") ? "partFrontFender" : "partRearFender"
      : part.id.startsWith("front") ? "partFrontDoor" : "partRearDoor";
    return `${side} ${t(kindKey)}`;
  }

  function tireText(id: TirePositionKey): string {
    const keys: Record<TirePositionKey, TranslationKey> = { frontLeft: "tireFrontLeft", frontRight: "tireFrontRight", rearLeft: "tireRearLeft", rearRight: "tireRearRight" };
    return t(keys[id]);
  }
  const tireByPosition = useMemo(() => new Map(tires.map((tire) => [tire.position, tire])), [tires]);
  const editable = Boolean(onChange);
  const tiresEditable = Boolean(onTiresChange);
  const selected = parts.find((part) => part.id === selectedId) ?? null;
  const selectedTire = tireShapes.find((tire) => tire.id === selectedId) ?? null;
  const selectedTireInfo = selectedTire ? tireByPosition.get(selectedTire.id) : undefined;
  const markedParts = parts.filter((part) => statusById.has(part.id));
  const markedTires = tireShapes.filter((tire) => tireByPosition.has(tire.id));

  function setTire(position: TirePositionKey, patch: Partial<VehicleTire>) {
    if (!onTiresChange) return;
    const current = tireByPosition.get(position);
    const next: VehicleTire = {
      position,
      size: patch.size ?? current?.size ?? "",
      status: patch.status ?? current?.status ?? "",
      note: patch.note ?? current?.note ?? "",
    };
    const rest = tires.filter((tire) => tire.position !== position);
    onTiresChange(next.size || next.status || next.note ? [...rest, next] : rest);
  }

  function copyTireTo(scope: "all" | "front" | "rear") {
    if (!onTiresChange || !selectedTire) return;
    const source = tireByPosition.get(selectedTire.id);
    if (!source || (!source.size && !source.status && !source.note)) return;
    const targets = tireShapes
      .map((tire) => tire.id)
      .filter((id) => scope === "all" || (scope === "front" ? id.startsWith("front") : id.startsWith("rear")));
    const rest = tires.filter((tire) => !targets.includes(tire.position));
    onTiresChange([...rest, ...targets.map((position) => ({ position, size: source.size, status: source.status, ...(source.note ? { note: source.note } : {}) }))]);
  }

  function setStatus(id: string, status: VehicleDamageStatus | null) {
    if (!onChange) return;
    const updated = value.filter((part) => part.id !== id);
    if (status) updated.push({ id, status });
    onChange(updated);
  }

  function setAll(status: VehicleDamageStatus | null) {
    if (!onChange) return;
    onChange(status ? parts.map((part) => ({ id: part.id, status })) : []);
  }

  return (
    <div className={editable ? "damage-map is-editable" : "damage-map"}>
      <div className="damage-map-illustration">
        <svg viewBox="0 0 340 440" role="img" aria-label="Aracın üstten görünümü ve parça durumları">
          <rect x="124" y="6" width="22" height="8" rx="2" fill="#dcdddc" />
          <rect x="194" y="6" width="22" height="8" rx="2" fill="#dcdddc" />
          <rect x="124" y="426" width="22" height="8" rx="2" fill="#dcdddc" />
          <rect x="194" y="426" width="22" height="8" rx="2" fill="#dcdddc" />
          <path d="M120 54 Q170 44 220 54 Q232 100 234 150 L234 290 Q234 340 224 392 L116 392 Q106 340 106 290 L106 150 Q108 100 120 54 Z" fill="#e4e5e3" />
          <path d="M34 62 Q60 56 84 62 L104 74 L104 150 L104 380 Q88 392 62 392 Q36 390 30 356 Q26 200 34 62 Z" fill="#e4e5e3" />
          <path d="M306 62 Q280 56 256 62 L236 74 L236 150 L236 380 Q252 392 278 392 Q304 390 310 356 Q314 200 306 62 Z" fill="#e4e5e3" />
          {parts.map((part) => {
            const status = statusById.get(part.id);
            const isSelected = part.id === selectedId;
            const label = `${partText(part)}: ${status ? statusText(status) : t("dmgUnspecified")}`;
            return (
              <g key={part.id}>
                <path
                  d={part.d}
                  transform={part.mirror ? `translate(${VIEW_WIDTH} 0) scale(-1 1)` : undefined}
                  fill={status ? statusColors[status] : "#cfd0ce"}
                  stroke={isSelected ? "#101614" : "#f4f4f2"}
                  strokeWidth={isSelected ? 3 : 2.2}
                  strokeLinejoin="round"
                  className={editable ? "damage-map-part" : undefined}
                  role={editable ? "button" : undefined}
                  tabIndex={editable ? 0 : undefined}
                  aria-label={label}
                  onClick={editable ? () => setSelectedId(part.id) : undefined}
                  onKeyDown={editable ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(part.id);
                    }
                  } : undefined}
                >
                  <title>{label}</title>
                </path>
                {status && statusLetters[status] ? (
                  <text x={part.cx} y={part.cy} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="800" fill="#fff" pointerEvents="none">{statusLetters[status]}</text>
                ) : null}
              </g>
            );
          })}
          <g pointerEvents="none" fill="#fff" stroke="#bfc1be" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M118 148 Q170 140 222 148 L210 226 Q170 230 130 226 Z" />
            <path d="M130 296 Q170 292 210 296 L222 358 Q170 364 118 358 Z" />
            {([false, true] as const).map((mirror) => (
              <g key={String(mirror)} transform={mirror ? `translate(${VIEW_WIDTH} 0) scale(-1 1)` : undefined}>
                <path d="M68 154 L98 150 L98 224 L60 216 Q64 184 68 154 Z" />
                <path d="M62 238 L98 236 L98 296 L63 292 Q60 264 62 238 Z" />
              </g>
            ))}
            <rect x="123" y="28" width="28" height="12" rx="6" />
            <rect x="189" y="28" width="28" height="12" rx="6" />
          </g>
          {tireShapes.map((tire) => {
            const hasInfo = tireByPosition.has(tire.id);
            const isSelected = tire.id === selectedId;
            return (
              <g key={tire.id}>
                <circle
                  cx={tire.cx}
                  cy={tire.cy}
                  r="24"
                  fill="#e1e2e0"
                  stroke={isSelected ? "#101614" : hasInfo ? "#2fbf84" : "#fbfbfa"}
                  strokeWidth={isSelected || hasInfo ? 3.5 : 3}
                  className={tiresEditable ? "damage-map-part" : undefined}
                  role={tiresEditable ? "button" : undefined}
                  tabIndex={tiresEditable ? 0 : undefined}
                  aria-label={`${tireText(tire.id)}${hasInfo ? `: ${t("tireInfoGiven")}` : ""}`}
                  onClick={tiresEditable ? () => setSelectedId(tire.id) : undefined}
                  onKeyDown={tiresEditable ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(tire.id);
                    }
                  } : undefined}
                >
                  <title>{tireText(tire.id)}{hasInfo ? `: ${[tireByPosition.get(tire.id)?.size, tireByPosition.get(tire.id)?.status].filter(Boolean).join(" · ")}` : ""}</title>
                </circle>
                <circle cx={tire.cx} cy={tire.cy} r="11" fill="none" stroke="#c6c8c5" strokeWidth="2" pointerEvents="none" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="damage-map-info">
        <div className="damage-legend">
          {statuses.map((status) => (
            <span key={status}><i style={{ backgroundColor: statusColors[status] }} />{statusText(status)}</span>
          ))}
          <span><i className="damage-unspecified" />{t("dmgUnspecified")}</span>
          {markedTires.length ? <span><i className="damage-tire-marked" />{t("tireInfoGiven")}</span> : null}
        </div>

        {editable ? (
          <>
            {tiresEditable && selectedTire ? (
              <div className="damage-picker">
                <strong>{tireText(selectedTire.id)}</strong>
                <div className="damage-tire-form">
                  <label>
                    Ebat
                    <input
                      type="text"
                      list="tire-size-suggestions"
                      placeholder="Örn. 205/55 R16"
                      value={selectedTireInfo?.size ?? ""}
                      onChange={(event) => setTire(selectedTire.id, { size: event.target.value })}
                    />
                    <datalist id="tire-size-suggestions">
                      {tireSizeSuggestions.map((size) => <option key={size} value={size} />)}
                    </datalist>
                  </label>
                  <label>
                    Durumu
                    <input
                      type="text"
                      list="tire-status-suggestions"
                      placeholder="Örn. Sıfır takıldı"
                      value={selectedTireInfo?.status ?? ""}
                      onChange={(event) => setTire(selectedTire.id, { status: event.target.value })}
                    />
                    <datalist id="tire-status-suggestions">
                      {tireStatusSuggestions.map((status) => <option key={status} value={status} />)}
                    </datalist>
                  </label>
                  <label>
                    Not (isteğe bağlı)
                    <input
                      type="text"
                      placeholder="Örn. 4 mevsim, marka bilgisi"
                      value={selectedTireInfo?.note ?? ""}
                      onChange={(event) => setTire(selectedTire.id, { note: event.target.value })}
                    />
                  </label>
                  <div className="damage-tire-copy">
                    <span>Bu bilgiyi uygula:</span>
                    <button type="button" disabled={!selectedTireInfo} onClick={() => copyTireTo("all")}>4 lastiğin tümüne</button>
                    <button type="button" disabled={!selectedTireInfo} onClick={() => copyTireTo("front")}>Ön 2 lastiğe</button>
                    <button type="button" disabled={!selectedTireInfo} onClick={() => copyTireTo("rear")}>Arka 2 lastiğe</button>
                  </div>
                  <button type="button" className="inline-control" onClick={() => setTire(selectedTire.id, { size: "", status: "", note: "" })}>Lastik bilgisini temizle</button>
                </div>
                <p className="admin-hint">Listedeki önerilerden seçebilir veya kendi değerinizi yazabilirsiniz.</p>
              </div>
            ) : null}
            {!(tiresEditable && selectedTire) ? (
            <div className="damage-picker">
              <strong>{selected ? selected.label : "Haritadan bir parça veya lastik seçin"}</strong>
              {selected ? (
                <div className="damage-picker-options">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={statusById.get(selected.id) === status ? "is-active" : undefined}
                      style={{ "--status-color": statusColors[status] } as React.CSSProperties}
                      onClick={() => setStatus(selected.id, status)}
                    >
                      <i style={{ backgroundColor: statusColors[status] }} />{statusLabels[status]}
                    </button>
                  ))}
                  <button type="button" className="damage-clear" onClick={() => setStatus(selected.id, null)}>Belirtilmemiş</button>
                </div>
              ) : <p className="admin-hint">Araç üzerindeki parçaya tıklayıp durumunu seçin; lastikler için tekerleğe tıklayıp ebat ve durum girin.</p>}
            </div>
            ) : null}
            <div className="damage-bulk">
              <button type="button" className="inline-control" onClick={() => setAll("original")}>Tüm parçalar orijinal</button>
              <button type="button" className="inline-control" onClick={() => setAll(null)}>Tümünü temizle</button>
            </div>
            <p className="admin-hint">Yalnızca kontrol ettiğiniz parçaları işaretleyin. İşaretlemediğiniz parçalar ilanda “belirtilmemiş” kalır.</p>
          </>
        ) : null}

        <ul className="damage-parts-list">
          {markedParts.length ? markedParts.map((part) => {
            const status = statusById.get(part.id) as VehicleDamageStatus;
            return (
              <li key={part.id}>
                <i style={{ backgroundColor: statusColors[status] }} />
                <span>{partText(part)}</span>
                <b style={{ color: statusColors[status] }}>{statusText(status)}</b>
              </li>
            );
          }) : <li className="damage-no-change">{t("damageNoRecord")}</li>}
        </ul>

        {markedTires.length ? (
          <ul className="damage-parts-list damage-tire-list">
            {markedTires.map((tire) => {
              const info = tireByPosition.get(tire.id) as VehicleTire;
              return (
                <li key={tire.id}>
                  <i className="damage-tire-marked" />
                  <span>{tireText(tire.id)}</span>
                  <b>{[info.size, info.status].filter(Boolean).join(" · ")}{info.note ? ` (${info.note})` : ""}</b>
                </li>
              );
            })}
          </ul>
        ) : null}
        {!editable && <small className="damage-disclaimer">{t("damageDisclaimer")}</small>}
      </div>
    </div>
  );
}
