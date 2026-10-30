export type VehicleTrim = { id: string; name: string; subTrims: { id: string; name: string }[] };
export type VehicleSeries = { id: string; name: string; trims: VehicleTrim[] };
export type VehicleModel = { id: string; name: string; series: VehicleSeries[] };
export type VehicleMake = { id: string; name: string; models: VehicleModel[] };
export type VehicleCatalog = { makes: VehicleMake[] };

const makeNames = [
  "Abarth", "Acura", "Alfa Romeo", "Alpine", "Aston Martin", "Audi", "Bentley", "BMW", "BYD", "Cadillac",
  "Chery", "Chevrolet", "Chrysler", "Citroën", "Cupra", "Dacia", "Daihatsu", "Dodge", "DS Automobiles",
  "Ferrari", "Fiat", "Ford", "Geely", "Genesis", "GMC", "Honda", "Hummer", "Hyundai", "Infiniti", "Isuzu",
  "Iveco", "Jaguar", "Jeep", "Kia", "Lada", "Lamborghini", "Lancia", "Land Rover", "Lexus", "Lincoln",
  "Lotus", "Lucid", "Maserati", "Maybach", "Mazda", "McLaren", "Mercedes-Benz", "Mercury", "MG", "Mini",
  "Mitsubishi", "Nissan", "Oldsmobile", "Opel", "Peugeot", "Polestar", "Pontiac", "Porsche", "Ram", "Renault",
  "Rivian", "Rolls-Royce", "Saab", "Saturn", "Scion", "SEAT", "Skoda", "Smart", "SsangYong", "Subaru", "Suzuki",
  "Tata", "Tesla", "Tofaş", "Toyota", "Volkswagen", "Volvo", "Wuling", "Zeekr",
];

export const defaultVehicleCatalog: VehicleCatalog = {
  makes: makeNames.map((name) => ({ id: catalogId(name), name, models: [] })),
};

export function catalogId(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function normalizeVehicleCatalog(value: unknown): VehicleCatalog {
  if (!value || typeof value !== "object" || !Array.isArray((value as { makes?: unknown }).makes)) {
    return defaultVehicleCatalog;
  }

  const source = value as { makes: unknown[] };
  const makes = source.makes.flatMap((entry): VehicleMake[] => {
    if (!entry || typeof entry !== "object") return [];
    const make = entry as Record<string, unknown>;
    if (typeof make.name !== "string" || !make.name.trim()) return [];
    return [{
      id: typeof make.id === "string" && make.id ? make.id : catalogId(make.name),
      name: make.name,
      models: normalizeNamedItems(make.models, "series").map((model) => ({
        ...model,
        series: normalizeNamedItems((model as VehicleModel).series, "trims").map((series) => ({
          ...series,
          trims: normalizeNamedItems((series as VehicleSeries).trims, "subTrims").map((trim) => ({
            ...trim,
            subTrims: normalizeNamedItems((trim as VehicleTrim).subTrims),
          })),
        })),
      })),
    }];
  });
  return { makes };
}

function normalizeNamedItems(value: unknown, childrenKey?: string): Array<{ id: string; name: string; [key: string]: unknown }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    if (typeof item.name !== "string" || !item.name.trim()) return [];
    return [{
      id: typeof item.id === "string" && item.id ? item.id : catalogId(item.name),
      name: item.name,
      ...(childrenKey ? { [childrenKey]: normalizeNamedItems(item[childrenKey], childrenKey === "series" ? "trims" : childrenKey === "trims" ? "subTrims" : undefined) } : {}),
    }];
  });
}
