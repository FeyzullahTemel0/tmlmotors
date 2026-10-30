"use client";

import { useMemo, useState } from "react";
import type { VehicleDamagePart, VehicleDamageStatus, VehicleTire } from "@/lib/vehicle-types";
import { tireSizeSuggestions, tireStatusSuggestions, type TirePositionKey } from "@/lib/vehicle-features";
import { usePreferences } from "@/lib/i18n/preferences-context";
import type { TranslationKey } from "@/lib/i18n/translations";

type PartShape = { id: string; label: string; d: string; mirror?: boolean };

// Sol taraf parçaları çizilir, sağ taraf aynı çizimin yansımasıdır.
const leftSide = [
  { position: "front", kind: "Fender", label: "ön çamurluk", d: "M74 106 Q74 80 110 74 L112 184 L78 192 Q72 148 74 106 Z" },
  { position: "front", kind: "Door", label: "ön kapı", d: "M78 197 L112 189 L112 300 L78 306 Q73 250 78 197 Z" },
  { position: "rear", kind: "Door", label: "arka kapı", d: "M78 311 L112 305 L112 404 L78 408 Q73 358 78 311 Z" },
  { position: "rear", kind: "Fender", label: "arka çamurluk", d: "M78 413 L112 409 L114 472 Q96 480 82 472 Q72 440 78 413 Z" },
] as const;

const sideNames = { left: "Sol", right: "Sağ" } as const;

const tireShapes: { id: TirePositionKey; x: number; y: number }[] = [
  { id: "frontLeft", x: 52, y: 112 },
  { id: "frontRight", x: 250, y: 112 },
  { id: "rearLeft", x: 52, y: 400 },
  { id: "rearRight", x: 250, y: 400 },
];

const parts: PartShape[] = [
  { id: "frontBumper", label: "Ön tampon", d: "M84 62 Q84 20 160 16 Q236 20 236 62 L236 70 Q160 60 84 70 Z" },
  { id: "hood", label: "Kaput", d: "M112 74 Q160 66 208 74 L208 178 Q160 170 112 178 Z" },
  { id: "roof", label: "Tavan", d: "M114 224 Q160 215 206 224 L204 354 Q160 363 116 354 Z" },
  { id: "trunk", label: "Bagaj kapağı", d: "M114 412 Q160 420 206 412 L204 474 Q160 480 116 474 Z" },
  { id: "rearBumper", label: "Arka tampon", d: "M84 480 Q160 488 236 480 L236 494 Q232 534 160 540 Q88 534 84 494 Z" },
  ...(["left", "right"] as const).flatMap((side) => leftSide.map((part): PartShape => ({
    id: `${part.position}${side === "left" ? "Left" : "Right"}${part.kind}`,
    label: `${sideNames[side]} ${part.label}`,
    d: part.d,
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
  original: "#7a9a7e",
  localPaint: "#e8a33d",
  painted: "#4a7fb8",
  changed: "#d2503f",
};

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
        <svg viewBox="0 0 320 560" role="img" aria-label="Aracın üstten görünümü ve parça durumları">
          <defs>
            <pattern id="tireTread" width="5" height="7" patternUnits="userSpaceOnUse">
              <rect width="5" height="7" fill="#232423" />
              <rect y="2.5" width="5" height="2" rx="1" fill="#434440" />
            </pattern>
          </defs>
          {tireShapes.map((tire) => {
            const hasInfo = tireByPosition.has(tire.id);
            const isSelected = tire.id === selectedId;
            return (
              <g key={tire.id}>
                <rect
                  x={tire.x}
                  y={tire.y}
                  width="18"
                  height="58"
                  rx="7"
                  fill={hasInfo ? "#2e3833" : "#262726"}
                  stroke={isSelected ? "#1b1b1b" : hasInfo ? "#c9a227" : "#151615"}
                  strokeWidth={isSelected ? 3 : hasInfo ? 2 : 1}
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
                </rect>
                <rect x={tire.x + 3} y={tire.y + 4} width="12" height="50" rx="4.5" fill="url(#tireTread)" pointerEvents="none" />
              </g>
            );
          })}
          {/* Zemin gölgesi */}
          <ellipse cx="160" cy="280" rx="98" ry="266" fill="#1b1b1b" opacity=".07" />
          {/* Gövde silüeti */}
          <path d="M84 70 Q84 22 160 17 Q236 22 236 70 L238 470 Q238 522 160 539 Q82 522 82 470 Z" fill="#ddd9cf" stroke="#8d8f89" strokeWidth="2" />
          {/* Ön cam */}
          <path d="M116 182 Q160 174 204 182 L209 219 Q160 210 111 219 Z" fill="#a9bcc8" stroke="#7d8e98" strokeWidth="1.5" />
          <path d="M126 186 L146 214 M150 183 L172 212" stroke="#ffffff" strokeOpacity=".4" strokeWidth="3" fill="none" />
          {/* Arka cam */}
          <path d="M111 359 Q160 368 209 359 L205 408 Q160 416 115 408 Z" fill="#a9bcc8" stroke="#7d8e98" strokeWidth="1.5" />
          <path d="M130 366 L150 400" stroke="#ffffff" strokeOpacity=".35" strokeWidth="3" fill="none" />
          {/* Yan aynalar */}
          <path d="M71 196 Q59 198 60 209 L72 211 Z" fill="#7f817b" stroke="#63655f" strokeWidth="1" />
          <path d="M249 196 Q261 198 260 209 L248 211 Z" fill="#7f817b" stroke="#63655f" strokeWidth="1" />
          {/* Kaput ve bagaj birleşim çizgileri + kaput kabartmaları */}
          <path d="M112 74 L112 178 M208 74 L208 178 M114 412 L116 474 M206 412 L204 474 M132 82 L130 170 M188 82 L190 170" stroke="#c2beb2" strokeWidth="1" fill="none" />
          {parts.map((part) => {
            const status = statusById.get(part.id);
            const isSelected = part.id === selectedId;
            const label = `${partText(part)}: ${status ? statusText(status) : t("dmgUnspecified")}`;
            return (
              <path
                key={part.id}
                d={part.d}
                transform={part.mirror ? "translate(320 0) scale(-1 1)" : undefined}
                fill={status ? statusColors[status] : "#efede7"}
                fillOpacity={status ? 0.85 : 0.55}
                stroke={isSelected ? "#1b1b1b" : status ? statusColors[status] : "#9a9c96"}
                strokeWidth={isSelected ? 3 : 1.6}
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
            );
          })}
          {/* Far, ızgara ve stop detayları her zaman görünür kalır */}
          <g pointerEvents="none">
            <path d="M93 52 Q107 42 128 45 L125 59 Q107 60 93 52 Z" fill="#f3ecd7" stroke="#8f8b7d" strokeWidth="1.2" />
            <path d="M227 52 Q213 42 192 45 L195 59 Q213 60 227 52 Z" fill="#f3ecd7" stroke="#8f8b7d" strokeWidth="1.2" />
            <path d="M140 30 L180 30 L177 46 L143 46 Z" fill="#bab5a8" stroke="#8f8b7d" strokeWidth="1.2" />
            <path d="M152 31 L151 45 M160 31 L160 45 M168 31 L169 45" stroke="#8f8b7d" strokeWidth="1" fill="none" />
            <path d="M94 502 Q108 510 126 506 L124 518 Q106 521 94 512 Z" fill="#c14b44" opacity=".92" />
            <path d="M226 502 Q212 510 194 506 L196 518 Q214 521 226 512 Z" fill="#c14b44" opacity=".92" />
            {/* Kapı kolları */}
            <rect x="82" y="286" width="13" height="4.5" rx="2.2" fill="#8f8b7d" opacity=".85" />
            <rect x="82" y="388" width="13" height="4.5" rx="2.2" fill="#8f8b7d" opacity=".85" />
            <rect x="225" y="286" width="13" height="4.5" rx="2.2" fill="#8f8b7d" opacity=".85" />
            <rect x="225" y="388" width="13" height="4.5" rx="2.2" fill="#8f8b7d" opacity=".85" />
          </g>
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
