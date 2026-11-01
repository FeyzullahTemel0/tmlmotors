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
  { id: "frontBumper", label: "Ön tampon", d: "M88 61 Q98 34 128 31 L192 31 Q222 34 232 61 L238 75 Q160 66 82 75 Z" },
  { id: "hood", label: "Kaput", d: "M102 78 Q160 69 218 78 L218 176 Q160 166 102 176 Z" },
  { id: "roof", label: "Tavan", d: "M113 223 Q160 212 207 223 L204 354 Q160 365 116 354 Z" },
  { id: "trunk", label: "Bagaj kapağı", d: "M102 412 Q160 422 218 412 L215 474 Q160 483 105 474 Z" },
  { id: "rearBumper", label: "Arka tampon", d: "M82 480 Q160 489 238 480 L235 507 Q226 536 160 543 Q94 536 85 507 Z" },
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
              <rect width="5" height="7" fill="#222526" />
              <path d="M0 2.5h5M0 6h5" stroke="#55595a" strokeWidth="1.1" />
            </pattern>
            <linearGradient id="damageBodyPaint" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#f4f3ef" />
              <stop offset=".48" stopColor="#d7d8d3" />
              <stop offset="1" stopColor="#aeb2ae" />
            </linearGradient>
            <linearGradient id="damageGlass" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#8198a5" />
              <stop offset=".45" stopColor="#cfdae0" />
              <stop offset="1" stopColor="#718893" />
            </linearGradient>
            <linearGradient id="damageWheel" x1="0" x2="1">
              <stop offset="0" stopColor="#151718" />
              <stop offset=".5" stopColor="#343839" />
              <stop offset="1" stopColor="#141617" />
            </linearGradient>
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
                  fill="url(#damageWheel)"
                  stroke={isSelected ? "#c39a55" : hasInfo ? "#bf9855" : "#111314"}
                  strokeWidth={isSelected ? 3 : hasInfo ? 2 : 1.2}
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
                <rect x={tire.x + 2.5} y={tire.y + 3} width="13" height="52" rx="4.5" fill="url(#tireTread)" pointerEvents="none" />
                <path d={`M${tire.x + 2} ${tire.y + 12}h14M${tire.x + 2} ${tire.y + 46}h14`} stroke="#777b7b" strokeOpacity=".65" strokeWidth="1" pointerEvents="none" />
              </g>
            );
          })}
          <ellipse cx="160" cy="286" rx="102" ry="270" fill="#17191a" opacity=".15" />
          <path d="M160 12 C126 12 103 20 92 43 L77 80 C70 99 68 118 68 141 L68 438 C68 480 77 512 94 533 C109 551 132 558 160 558 C188 558 211 551 226 533 C243 512 252 480 252 438 L252 141 C252 118 250 99 243 80 L228 43 C217 20 194 12 160 12 Z" fill="url(#damageBodyPaint)" stroke="#676c6b" strokeWidth="2.4" />
          <path d="M78 132 Q88 118 103 119 M242 132 Q232 118 217 119 M78 438 Q88 452 103 451 M242 438 Q232 452 217 451" fill="none" stroke="#8c918e" strokeWidth="1.5" />
          <path d="M111 178 Q160 166 209 178 L215 215 Q160 205 105 215 Z" fill="url(#damageGlass)" stroke="#586a72" strokeWidth="1.8" />
          <path d="M116 183 Q160 174 204 183 M120 187 L140 207 M147 183 L163 204 M174 181 L193 204" stroke="#edf2f2" strokeOpacity=".42" strokeWidth="1.5" fill="none" />
          <path d="M105 221 Q160 209 215 221 L208 354 Q160 365 112 354 Z" fill="url(#damageBodyPaint)" stroke="#727876" strokeWidth="1.6" />
          <path d="M114 359 Q160 370 206 359 L212 404 Q160 416 108 404 Z" fill="url(#damageGlass)" stroke="#586a72" strokeWidth="1.8" />
          <path d="M115 364 Q160 375 205 364 M128 367 L145 401 M157 373 L173 405 M184 369 L199 400" stroke="#edf2f2" strokeOpacity=".38" strokeWidth="1.4" fill="none" />
          <path d="M70 190 Q57 190 58 205 Q59 215 72 216 L78 208 Z M250 190 Q263 190 262 205 Q261 215 248 216 L242 208 Z" fill="url(#damageBodyPaint)" stroke="#636968" strokeWidth="1.6" />
          <path d="M104 79 L104 171 Q160 161 216 171 L216 79 M100 412 Q160 424 220 412 M102 475 Q160 485 218 475" stroke="#7e8380" strokeOpacity=".75" strokeWidth="1.35" fill="none" />
          <path d="M112 84 Q160 75 208 84 M115 168 Q160 159 205 168 M116 230 Q160 220 204 230 M116 346 Q160 356 204 346 M114 418 Q160 428 206 418" stroke="#fafaf8" strokeOpacity=".55" strokeWidth="1.2" fill="none" />
          <path d="M95 67 Q106 60 124 61 M225 67 Q214 60 196 61 M91 491 Q104 500 122 499 M229 491 Q216 500 198 499" stroke="#858a87" strokeWidth="1.5" fill="none" />
          <path d="M72 91 L84 95 M248 91 L236 95 M72 473 L84 469 M248 473 L236 469" stroke="#777c79" strokeWidth="1.2" />
          {parts.map((part) => {
            const status = statusById.get(part.id);
            const isSelected = part.id === selectedId;
            const label = `${partText(part)}: ${status ? statusText(status) : t("dmgUnspecified")}`;
            return (
              <path
                key={part.id}
                d={part.d}
                transform={part.mirror ? "translate(320 0) scale(-1 1)" : undefined}
                fill={status ? statusColors[status] : "transparent"}
                fillOpacity={status ? 0.72 : 1}
                stroke={isSelected ? "#1b1b1b" : status ? statusColors[status] : "#747a77"}
                strokeOpacity={status ? 0.95 : 0.6}
                strokeWidth={isSelected ? 3 : status ? 2 : 1.2}
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
          <g pointerEvents="none">
            <path d="M93 51 Q106 39 128 42 L127 57 Q108 59 93 51 Z M227 51 Q214 39 192 42 L193 57 Q212 59 227 51 Z" fill="#f5f2e7" stroke="#777d7a" strokeWidth="1.3" />
            <path d="M139 29 Q160 25 181 29 L178 45 Q160 42 142 45 Z" fill="#444a4a" stroke="#747a77" strokeWidth="1.1" />
            <path d="M151 30 L150 43 M160 29 L160 43 M169 30 L170 43" stroke="#bcc0bc" strokeWidth=".8" />
            <path d="M94 501 Q108 509 126 506 L124 519 Q107 522 94 513 Z M226 501 Q212 509 194 506 L196 519 Q213 522 226 513 Z" fill="#a9433e" stroke="#763c38" strokeWidth="1" />
            <rect x="82" y="286" width="13" height="4.5" rx="2.2" fill="#676d6a" />
            <rect x="82" y="388" width="13" height="4.5" rx="2.2" fill="#676d6a" />
            <rect x="225" y="286" width="13" height="4.5" rx="2.2" fill="#676d6a" />
            <rect x="225" y="388" width="13" height="4.5" rx="2.2" fill="#676d6a" />
            <path d="M93 277 L108 277 M93 382 L108 382 M227 277 L212 277 M227 382 L212 382" stroke="#f9f8f3" strokeOpacity=".7" strokeWidth="1" />
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
