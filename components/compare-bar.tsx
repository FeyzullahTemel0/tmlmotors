"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Scale, X } from "lucide-react";
import { MAX_COMPARE, useVehicleCollections } from "@/lib/vehicle-collections";

export function CompareBar() {
  const pathname = usePathname() ?? "";
  const { compareIds, clearCompare } = useVehicleCollections();
  const hidden = !compareIds.length || pathname === "/karsilastir" || pathname === "/giris" || /^\/araclar\/[^/]+/.test(pathname);
  if (hidden) return null;

  return (
    <div className="compare-bar" role="region" aria-label="Karşılaştırma listesi">
      <Scale size={17} aria-hidden="true" />
      <span><b>{compareIds.length}</b> / {MAX_COMPARE} araç seçildi</span>
      <Link href="/karsilastir" className="compare-bar-go">{compareIds.length < 2 ? "Bir araç daha seçin" : "Karşılaştır"} <ArrowRight size={14} /></Link>
      <button type="button" onClick={clearCompare} aria-label="Karşılaştırma listesini temizle"><X size={16} /></button>
    </div>
  );
}
