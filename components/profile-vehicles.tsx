"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Heart, Scale } from "lucide-react";
import { VehicleCard } from "@/components/vehicle-catalog";
import { Loading } from "@/components/loading";
import { useVehicleCollections } from "@/lib/vehicle-collections";
import type { Vehicle } from "@/lib/vehicle-types";

export function ProfileVehicles({ kind }: { kind: "favorites" | "compare" }) {
  const { favoriteIds, compareIds } = useVehicleCollections();
  const ids = kind === "favorites" ? favoriteIds : compareIds;
  const key = ids.join(",");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(Boolean(key));

  useEffect(() => {
    let mounted = true;
    if (!key) {
      setVehicles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetch(`/api/vehicles?ids=${encodeURIComponent(key)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { vehicles?: Vehicle[] }) => {
        if (!mounted) return;
        const order = key.split(",");
        setVehicles((data.vehicles ?? []).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)));
      })
      .catch(() => { if (mounted) setVehicles([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [key]);

  const Icon = kind === "favorites" ? Heart : Scale;
  const emptyText = kind === "favorites"
    ? "Henüz favori ilanınız yok. Beğendiğiniz ilanlardaki kalp simgesine dokunun; listeniz hesabınızda saklanır."
    : "Karşılaştırma listeniz boş. İlan kartlarındaki terazi simgesiyle en fazla üç araç seçebilirsiniz.";

  return (
    <section className="pf-card pf-panel" role="tabpanel" aria-label={kind === "favorites" ? "Favori ilanlar" : "Karşılaştırma"}>
      {loading ? <Loading label="İlanlar getiriliyor" /> : null}
      {!loading && vehicles.length ? (
        <>
          {kind === "compare" && vehicles.length > 1 ? <p className="pf-compare-cta"><Link className="button button-primary" href="/karsilastir">Yan yana karşılaştır <ArrowRight size={15} /></Link></p> : null}
          <div className="vehicle-grid pf-vehicle-grid">{vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}</div>
        </>
      ) : null}
      {!loading && !vehicles.length ? (
        <div className="pf-empty">
          <Icon size={22} strokeWidth={1.4} />
          <p>{emptyText}</p>
          <Link className="text-link" href="/araclar">İlanlara göz atın <ArrowRight size={14} /></Link>
        </div>
      ) : null}
    </section>
  );
}
