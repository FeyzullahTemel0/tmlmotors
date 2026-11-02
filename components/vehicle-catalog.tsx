"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { formatMileage, type Vehicle } from "@/lib/vehicle-types";
import { Loading } from "@/components/loading";
import { usePreferences } from "@/lib/i18n/preferences-context";
import { CompareButton, FavoriteButton } from "@/components/vehicle-actions";

export function VehicleCatalog({ featuredOnly = false, scope = "normal" }: { featuredOnly?: boolean; scope?: "normal" | "damaged" }) {
  const { t } = usePreferences();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [makeFilter, setMakeFilter] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [minimumYear, setMinimumYear] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; scrollLeft: number } | null>(null);
  const draggedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const response = await fetch(`/api/vehicles?scope=${scope}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Araç ilanları şu anda alınamıyor.");
        if (mounted) setVehicles(data.vehicles as Vehicle[]);
      } catch (error) {
        if (mounted) setErrorMessage(error instanceof Error ? error.message : "Araç ilanları alınamadı.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [scope]);

  const filteredVehicles = useMemo(() => {
    const normalized = query.toLocaleLowerCase("tr-TR").trim();
    const filtered = vehicles.filter((vehicle) =>
      `${vehicle.title} ${vehicle.brand} ${vehicle.series ?? ""} ${vehicle.model} ${vehicle.trim ?? ""} ${vehicle.subTrim ?? ""} ${vehicle.year}`.toLocaleLowerCase("tr-TR").includes(normalized)
      && (!makeFilter || vehicle.brand === makeFilter)
      && (!minimumPrice || (vehicle.price !== null && vehicle.price >= Number(minimumPrice)))
      && (!maximumPrice || (vehicle.price !== null && vehicle.price <= Number(maximumPrice)))
      && (!minimumYear || vehicle.year >= Number(minimumYear)),
    );
    return filtered;
  }, [featuredOnly, makeFilter, maximumPrice, minimumPrice, minimumYear, query, vehicles]);

  const makes = useMemo(() => Array.from(new Set(vehicles.map((vehicle) => vehicle.brand))).sort((a, b) => a.localeCompare(b, "tr-TR")), [vehicles]);

  function scrollCarousel(direction: -1 | 1) {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: direction * carouselRef.current.clientWidth * 0.8, behavior: "smooth" });
  }

  // Kart bağlantılarının tıklanabilir kalması için yakalama yalnızca gerçek sürükleme başlayınca yapılır.
  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || !carouselRef.current) return;
    draggedRef.current = false;
    dragRef.current = { startX: event.clientX, scrollLeft: carouselRef.current.scrollLeft };
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !carouselRef.current) return;
    if (event.buttons !== 1) { dragRef.current = null; return; }
    const distance = event.clientX - dragRef.current.startX;
    if (!draggedRef.current && Math.abs(distance) > 6) {
      draggedRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (draggedRef.current) {
      event.preventDefault();
      carouselRef.current.scrollLeft = dragRef.current.scrollLeft - distance;
    }
  }

  return (
    <>
      {!featuredOnly ? <div className="catalog-toolbar"><span>{loading ? t("loadingVehicles") : t("catalogCount").replace("{count}", String(filteredVehicles.length))}</span><label className="catalog-search"><Search size={16} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("catalogSearchPlaceholder")} /></label></div> : null}
      {!featuredOnly && !loading && !errorMessage && vehicles.length ? <div className={filtersOpen ? "listing-filters is-open" : "listing-filters"}>
        <button type="button" className="filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
          <SlidersHorizontal size={16} /> {t("filterLabel")}
          {[makeFilter, minimumPrice, maximumPrice, minimumYear].filter(Boolean).length ? <b className="filter-count">{[makeFilter, minimumPrice, maximumPrice, minimumYear].filter(Boolean).length}</b> : null}
          <ChevronDown size={16} className="filter-chevron" />
        </button>
        <select aria-label={t("allMakes")} value={makeFilter} onChange={(event) => setMakeFilter(event.target.value)}><option value="">{t("allMakes")}</option>{makes.map((make) => <option key={make} value={make}>{make}</option>)}</select>
        <input aria-label={t("minPrice")} type="number" min="0" placeholder={t("minPrice")} value={minimumPrice} onChange={(event) => setMinimumPrice(event.target.value)} />
        <input aria-label={t("maxPrice")} type="number" min="0" placeholder={t("maxPrice")} value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} />
        <input aria-label={t("minYear")} type="number" min="1950" max={new Date().getFullYear() + 1} placeholder={t("minYear")} value={minimumYear} onChange={(event) => setMinimumYear(event.target.value)} />
      </div> : null}
      {loading ? <Loading label={t("catalogFetching")} /> : null}
      {errorMessage ? <div className="catalog-state catalog-error">{errorMessage}</div> : null}
      {!loading && !errorMessage && filteredVehicles.length > 0 ? (
        featuredOnly ? <div className="vehicle-carousel-wrap">
          <div className="vehicle-carousel-controls"><span>{t("catalogCount").replace("{count}", String(vehicles.length))}</span><div><button type="button" aria-label={t("prevVehicles")} onClick={() => scrollCarousel(-1)}><ArrowLeft size={17} /></button><button type="button" aria-label={t("nextVehicles")} onClick={() => scrollCarousel(1)}><ArrowRight size={17} /></button></div></div>
          <div className="vehicle-carousel" ref={carouselRef} tabIndex={0} aria-label="Yayındaki araç ilanları"
            onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { dragRef.current = null; }} onDragStart={(event) => event.preventDefault()}
            onPointerCancel={() => { dragRef.current = null; }} onClickCapture={(event) => {
              if (!draggedRef.current) return;
              event.preventDefault();
              event.stopPropagation();
              draggedRef.current = false;
            }}>
            {filteredVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
          </div>
        </div> : <div className="vehicle-grid">{filteredVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}</div>
      ) : null}
      {!loading && !errorMessage && filteredVehicles.length === 0 ? (
        <div className="catalog-empty"><span className="eyebrow">ENVANTER</span><h3>{query || makeFilter || minimumPrice || maximumPrice || minimumYear ? t("emptyFilteredTitle") : t("emptyInventoryTitle")}</h3><p>{query || makeFilter || minimumPrice || maximumPrice || minimumYear ? t("emptyFilteredText") : t("emptyInventoryText")}</p><a className="text-link" href="tel:+905535781136">{t("emptyCall")} <ArrowRight size={14} /></a></div>
      ) : null}
    </>
  );
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { formatPrice, t } = usePreferences();
  const image = vehicle.imageUrls?.[0];
  return (
    <article className="vehicle-card">
      <Link href={`/araclar/${vehicle.id}`} className={image ? "vehicle-card-image has-image" : "vehicle-card-image"} style={image ? { backgroundImage: `url("${image}")` } : undefined} aria-label={`${vehicle.title} ilan detayları`}>
        <span className="vehicle-card-label">{vehicle.heavyDamage ? "AĞIR HASARLI" : vehicle.featured ? "TML MOTORS SEÇKİSİ" : "TML MOTORS İLANI"}</span>
        <span className="vehicle-card-arrow"><ArrowUpRight size={17} /></span>
      </Link>
      <div className="vehicle-card-actions"><FavoriteButton vehicleId={vehicle.id} /><CompareButton vehicleId={vehicle.id} /></div>
      <div className="vehicle-card-info">
        <div className="vehicle-card-overline">{vehicle.year} <span /> {vehicle.brand}</div>
        <h3><Link href={`/araclar/${vehicle.id}`}>{vehicle.title || [vehicle.brand, vehicle.series, vehicle.model, vehicle.trim, vehicle.subTrim].filter(Boolean).join(" ")}</Link></h3>
        <div className="vehicle-card-specs">{formatMileage(vehicle.mileage)}{vehicle.fuel ? <><span />{vehicle.fuel}</> : null}{vehicle.transmission ? <><span />{vehicle.transmission}</> : null}</div>
        <div className="vehicle-card-bottom"><b>{formatPrice(vehicle.price)}</b><Link href={`/araclar/${vehicle.id}`} aria-label={t("viewDetails")}><ArrowRight size={16} /></Link></div>
      </div>
    </article>
  );
}
