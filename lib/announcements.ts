export type AnnouncementCriteria = {
  brand: string;
  model: string;
  bodyType: string;
  minPrice: number | null;
  maxPrice: number | null;
};

export const bodyTypeOptions = ["Sedan", "Hatchback", "SUV", "Station Wagon", "Coupe", "Cabrio", "Minivan / Panelvan", "Pick-up"];

const money = (value: number) => `${new Intl.NumberFormat("tr-TR").format(value)} ₺`;

export function describePriceRange(minPrice: number | null, maxPrice: number | null): string {
  if (minPrice !== null && maxPrice !== null) return `${money(minPrice)} – ${money(maxPrice)}`;
  if (minPrice !== null) return `${money(minPrice)} ve üzeri`;
  if (maxPrice !== null) return `${money(maxPrice)} altı`;
  return "";
}

// Duyurudaki arama ölçütlerini tek satırlık özet metne çevirir.
export function describeCriteria(criteria: AnnouncementCriteria): string {
  return [[criteria.brand, criteria.model].filter(Boolean).join(" "), criteria.bodyType, describePriceRange(criteria.minPrice, criteria.maxPrice)]
    .filter(Boolean)
    .join(" · ");
}
