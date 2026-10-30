import type { AdShape } from "@/lib/ad-placements";

export type AdminAd = {
  id: string;
  title: string;
  business: string;
  description: string;
  url: string;
  imageUrl: string;
  placements: string[];
  priority: number;
  startDate: string;
  endDate: string;
  sponsorNote: string;
  active: boolean;
  clicks?: number;
  createdAt?: string | null;
};

export type AdDraft = Omit<AdminAd, "id" | "clicks" | "createdAt"> & { id?: string };

export const emptyAdDraft: AdDraft = {
  title: "", business: "", description: "", url: "", imageUrl: "", placements: [],
  priority: 0, startDate: "", endDate: "", sponsorNote: "", active: true,
};

export type AdStatus = "live" | "scheduled" | "expired" | "paused";

export function getAdStatus(ad: Pick<AdminAd, "active" | "startDate" | "endDate">, today = new Date().toISOString().slice(0, 10)): AdStatus {
  if (!ad.active) return "paused";
  if (ad.startDate && ad.startDate > today) return "scheduled";
  if (ad.endDate && ad.endDate < today) return "expired";
  return "live";
}

export const adStatusLabels: Record<AdStatus, string> = {
  live: "Yayında", scheduled: "Planlandı", expired: "Süresi doldu", paused: "Durduruldu",
};

export const shapeLabels: Record<AdShape, string> = {
  wide: "Yatay banner", strip: "İnce şerit", tall: "Dikey banner",
};
