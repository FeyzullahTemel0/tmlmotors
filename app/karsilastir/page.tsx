"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Scale, X } from "lucide-react";
import { formatMileage, type Vehicle } from "@/lib/vehicle-types";
import { Loading } from "@/components/loading";
import { usePreferences } from "@/lib/i18n/preferences-context";
import { useVehicleCollections } from "@/lib/vehicle-collections";
import { FavoriteButton } from "@/components/vehicle-actions";

type Row = { label: string; value: (vehicle: Vehicle) => string };

const damageLabel = (vehicle: Vehicle) => {
  const parts = vehicle.damageParts ?? [];
  if (!parts.length) return "Bilgi için sorunuz";
  const changed = parts.filter((part) => part.status === "changed").length;
  const painted = parts.filter((part) => part.status === "painted" || part.status === "localPaint").length;
  if (!changed && !painted) return "Tüm parçalar orijinal";
  return [changed ? `${changed} değişen` : "", painted ? `${painted} boyalı` : ""].filter(Boolean).join(", ");
};

export default function ComparePage() {
  const { formatPrice } = usePreferences();
  const { compareIds, removeCompare, clearCompare } = useVehicleCollections();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const key = compareIds.join(",");

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

  const rows = useMemo<Row[]>(() => [
    { label: "Fiyat", value: (vehicle) => formatPrice(vehicle.price) },
    { label: "Model yılı", value: (vehicle) => String(vehicle.year) },
    { label: "Kilometre", value: (vehicle) => formatMileage(vehicle.mileage) },
    { label: "Yakıt", value: (vehicle) => vehicle.fuel },
    { label: "Vites", value: (vehicle) => vehicle.transmission },
    { label: "Kasa tipi", value: (vehicle) => vehicle.bodyType },
    { label: "Motor hacmi", value: (vehicle) => vehicle.engineVolume ?? "" },
    { label: "Motor gücü", value: (vehicle) => vehicle.enginePower ?? "" },
    { label: "Çekiş", value: (vehicle) => vehicle.drive ?? "" },
    { label: "Renk", value: (vehicle) => vehicle.color },
    { label: "Boya / değişen", value: damageLabel },
    { label: "Takas", value: (vehicle) => vehicle.trade ? "Takas yapılır" : "Takas yok" },
  ], [formatPrice]);

  return (
    <>
      <section className="subpage-hero"><div className="container">
        <span className="eyebrow eyebrow-light">KARŞILAŞTIRMA</span>
        <h1>Araçları yan yana karşılaştırın</h1>
        <p>En fazla üç aracı seçip fiyat, kilometre, donanım ve hasar bilgisini tek tabloda görün. Listeniz hesabınıza kaydedilir.</p>
      </div></section>
      <section className="listing-section"><div className="container">
        {loading ? <Loading label="Karşılaştırma hazırlanıyor" /> : null}
        {!loading && vehicles.length === 0 ? (
          <div className="catalog-empty"><span className="eyebrow">LİSTE BOŞ</span><h3>Karşılaştırılacak araç seçilmedi</h3><p>İlan kartlarındaki karşılaştırma simgesine dokunarak araç ekleyin.</p><Link className="text-link" href="/araclar">İlanlara göz atın <ArrowRight size={14} /></Link></div>
        ) : null}
        {!loading && vehicles.length > 0 ? (
          <div className="compare-wrap">
            <div className="compare-actions">
              <Link href="/araclar" className="text-link"><ArrowLeft size={14} /> İlanlara dön</Link>
              <button type="button" className="inline-control" onClick={clearCompare}><X size={14} /> Listeyi temizle</button>
            </div>
            {vehicles.length < 2 ? <p className="compare-hint"><Scale size={15} /> Karşılaştırma için bir araç daha ekleyin.</p> : null}
            <div className="compare-scroll">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th scope="col"><span className="sr-only">Özellik</span></th>
                    {vehicles.map((vehicle) => (
                      <th scope="col" key={vehicle.id}>
                        <div className="compare-head">
                          <Link href={`/araclar/${vehicle.id}`} className="compare-image" style={vehicle.imageUrls?.[0] ? { backgroundImage: `url("${vehicle.imageUrls[0]}")` } : undefined} aria-label={vehicle.title} />
                          <Link href={`/araclar/${vehicle.id}`} className="compare-title">{vehicle.title}</Link>
                          <div className="compare-head-actions">
                            <FavoriteButton vehicleId={vehicle.id} />
                            <button type="button" className="vehicle-action" aria-label="Karşılaştırmadan çıkar" title="Karşılaştırmadan çıkar" onClick={() => removeCompare(vehicle.id)}><X size={15} /></button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {vehicles.map((vehicle) => <td key={vehicle.id}>{row.value(vehicle) || "—"}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div></section>
    </>
  );
}
