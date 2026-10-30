import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";
import { catalogId, defaultVehicleCatalog, normalizeVehicleCatalog, type VehicleCatalog } from "@/lib/vehicle-catalog";

type CatalogLevel = "make" | "model" | "series" | "trim" | "subTrim";

function findById<T extends { id: string; name: string }>(items: T[], id: string) {
  return items.find((item) => item.id === id);
}

function addNamedItem(items: Array<{ id: string; name: string }>, name: string) {
  if (items.some((item) => item.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"))) {
    throw new InputError("Bu katalog seçeneği zaten mevcut.");
  }
  const id = catalogId(name);
  if (!id || items.some((item) => item.id === id)) throw new InputError("Bu ad güvenli bir katalog kimliğine dönüştürülemedi.");
  items.push({ id, name });
  items.sort((first, second) => first.name.localeCompare(second.name, "tr-TR"));
  return id;
}

function addCatalogEntry(catalog: VehicleCatalog, level: CatalogLevel, name: string, parentIds: Record<string, string>) {
  if (level === "make") {
    return addNamedItem(catalog.makes, name);
  }

  const make = findById(catalog.makes, parentIds.makeId);
  if (!make) throw new InputError("Önce geçerli bir marka seçin.");
  if (level === "model") return addNamedItem(make.models, name);

  const model = findById(make.models, parentIds.modelId);
  if (!model) throw new InputError("Önce geçerli bir model seçin.");
  if (level === "series") return addNamedItem(model.series, name);

  const series = findById(model.series, parentIds.seriesId);
  if (!series) throw new InputError("Önce geçerli bir seri seçin.");
  if (level === "trim") return addNamedItem(series.trims, name);

  const trim = findById(series.trims, parentIds.trimId);
  if (!trim) throw new InputError("Önce geçerli bir paket seçin.");
  return addNamedItem(trim.subTrims, name);
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getAdminDb().collection("siteSettings").doc("vehicleCatalog").get();
    const catalog = snapshot.exists ? normalizeVehicleCatalog(snapshot.data()) : defaultVehicleCatalog;
    return NextResponse.json({ catalog });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new InputError("Katalog bilgileri geçersiz.");
    const data = body as Record<string, unknown>;
    const level = data.level as CatalogLevel;
    const name = typeof data.name === "string" ? data.name.trim().slice(0, 100) : "";
    if (!["make", "model", "series", "trim", "subTrim"].includes(level)) throw new InputError("Marka, model, seri veya paket seviyesi seçin.");
    if (!name) throw new InputError("Katalog adı boş bırakılamaz.");

    const db = getAdminDb();
    const reference = db.collection("siteSettings").doc("vehicleCatalog");
    const id = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const catalog = snapshot.exists ? normalizeVehicleCatalog(snapshot.data()) : defaultVehicleCatalog;
      const parentIds: Record<string, string> = {};
      for (const key of ["makeId", "modelId", "seriesId", "trimId"]) {
        parentIds[key] = typeof data[key] === "string" ? data[key] as string : "";
      }
      const entryId = addCatalogEntry(catalog, level, name, parentIds);
      transaction.set(reference, {
        ...catalog,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return entryId;
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
