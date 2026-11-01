"use client";

import { useRouter } from "next/navigation";
import { Check, Heart, Scale } from "lucide-react";
import { MAX_COMPARE, useVehicleCollections } from "@/lib/vehicle-collections";

type Variant = "icon" | "full";

export function FavoriteButton({ vehicleId, variant = "icon" }: { vehicleId: string; variant?: Variant }) {
  const { isFavorite, toggleFavorite, notify } = useVehicleCollections();
  const router = useRouter();
  const active = isFavorite(vehicleId);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const result = await toggleFavorite(vehicleId);
    if (result === "login") {
      notify("Favorilere eklemek için giriş yapın.");
      router.push(`/giris?next=${encodeURIComponent(window.location.pathname)}`);
    } else if (result === "added") notify("Favorilerinize eklendi. Profilinizden her zaman ulaşabilirsiniz.");
    else if (result === "removed") notify("Favorilerinizden çıkarıldı.");
    else notify("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
  }

  return (
    <button type="button" className={`vehicle-action ${variant === "full" ? "full" : ""} ${active ? "active" : ""}`} aria-pressed={active} aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"} title={active ? "Favorilerden çıkar" : "Favorilere ekle"} onClick={handleClick}>
      <Heart size={variant === "full" ? 16 : 15} fill={active ? "currentColor" : "none"} />
      {variant === "full" ? <span>{active ? "Favorilerde" : "Favorilere ekle"}</span> : null}
    </button>
  );
}

export function CompareButton({ vehicleId, variant = "icon" }: { vehicleId: string; variant?: Variant }) {
  const { isCompared, toggleCompare, notify } = useVehicleCollections();
  const active = isCompared(vehicleId);

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const result = toggleCompare(vehicleId);
    if (result === "full") notify(`En fazla ${MAX_COMPARE} aracı karşılaştırabilirsiniz.`);
    else if (result === "added") notify("Karşılaştırma listesine eklendi.");
    else notify("Karşılaştırma listesinden çıkarıldı.");
  }

  return (
    <button type="button" className={`vehicle-action ${variant === "full" ? "full" : ""} ${active ? "active" : ""}`} aria-pressed={active} aria-label={active ? "Karşılaştırmadan çıkar" : "Karşılaştır"} title={active ? "Karşılaştırmadan çıkar" : "Karşılaştır"} onClick={handleClick}>
      {active ? <Check size={variant === "full" ? 16 : 15} /> : <Scale size={variant === "full" ? 16 : 15} />}
      {variant === "full" ? <span>{active ? "Karşılaştırmada" : "Karşılaştır"}</span> : null}
    </button>
  );
}
