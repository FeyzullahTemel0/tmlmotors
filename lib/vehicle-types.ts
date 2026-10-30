export type VehicleStatus = "draft" | "published" | "sold";
export type VehicleDamageStatus = "original" | "painted" | "localPaint" | "changed";
export type VehicleDamagePart = {
  id: string;
  status: VehicleDamageStatus;
};
export type FeatureGroupKey = "security" | "interior" | "exterior" | "multimedia";
export type VehicleFeatures = Partial<Record<FeatureGroupKey, string[]>>;
export type VehicleFeatureNotes = Partial<Record<FeatureGroupKey, string>>;
export type TirePositionKey = "frontLeft" | "frontRight" | "rearLeft" | "rearRight";
export type VehicleTire = {
  position: TirePositionKey;
  size: string;
  status: string;
  note?: string;
};

export type Vehicle = {
  id: string;
  title: string;
  brand: string;
  series?: string;
  model: string;
  trim?: string;
  subTrim?: string;
  year: number;
  mileage: number;
  price: number | null;
  fuel: string;
  transmission: string;
  bodyType: string;
  engineVolume?: string;
  enginePower?: string;
  drive?: string;
  color: string;
  vehicleCondition?: string;
  from?: string;
  trade?: boolean;
  sahibindenUrl?: string;
  damageParts?: VehicleDamagePart[];
  features?: VehicleFeatures;
  featureNotes?: VehicleFeatureNotes;
  tires?: VehicleTire[];
  description: string;
  imageUrls: string[];
  status: VehicleStatus;
  featured: boolean;
};

export function formatVehiclePrice(price: number | null): string {
  if (price === null) return "Fiyat için arayın";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(price);
}

export function formatMileage(mileage: number): string {
  return `${new Intl.NumberFormat("tr-TR").format(mileage)} km`;
}
