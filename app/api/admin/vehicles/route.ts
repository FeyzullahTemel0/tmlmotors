import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";

const allowedStatuses = ["draft", "published", "sold"] as const;
type VehicleStatus = (typeof allowedStatuses)[number];
const allowedDamageStatuses = ["original", "painted", "localPaint", "changed"] as const;
const allowedDamageParts = new Set([
  "frontBumper", "hood", "frontLeftFender", "frontRightFender", "frontLeftDoor", "frontRightDoor",
  "rearLeftDoor", "rearRightDoor", "rearLeftFender", "rearRightFender", "trunk", "rearBumper", "roof",
]);
const allowedFeatureGroups = new Set(["security", "interior", "exterior", "multimedia"]);
const allowedTirePositions = new Set(["frontLeft", "frontRight", "rearLeft", "rearRight"]);

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanSahibindenUrl(value: unknown): string {
  const url = cleanText(value, 500);
  if (!url) return "";
  if (!/^https:\/\/(www\.)?sahibinden\.com\//.test(url)) throw new InputError("Sahibinden bağlantısı https://www.sahibinden.com/ ile başlamalıdır.");
  return url;
}

function validateVehicle(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("İlan verileri geçersiz.");
  const data = value as Record<string, unknown>;
  const brand = cleanText(data.brand, 80);
  const model = cleanText(data.model, 100);
  const series = cleanText(data.series, 100);
  const trim = cleanText(data.trim, 100);
  const subTrim = cleanText(data.subTrim, 100);
  const title = cleanText(data.title, 150) || [brand, series, model, trim, subTrim].filter(Boolean).join(" ");
  const year = Number(data.year);
  const mileage = Number(data.mileage);
  const price = data.price === null || data.price === "" ? null : Number(data.price);
  const status = cleanText(data.status, 20) as VehicleStatus;
  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls.filter((url): url is string => typeof url === "string" && /^https:\/\//.test(url)).slice(0, 20)
    : [];

  if (!brand || !model || !title) throw new InputError("Marka, model ve ilan başlığı zorunludur.");
  if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) throw new InputError("Model yılı geçersiz.");
  if (!Number.isFinite(mileage) || mileage < 0 || mileage > 2_000_000) throw new InputError("Kilometre değeri geçersiz.");
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 1_000_000_000)) throw new InputError("Fiyat değeri geçersiz.");
  if (!allowedStatuses.includes(status)) throw new InputError("İlan durumu geçersiz.");
  if (data.damageParts !== undefined && !Array.isArray(data.damageParts)) throw new InputError("Boya ve değişen parça bilgisi geçersiz.");
  const damageParts = (Array.isArray(data.damageParts) ? data.damageParts : []).slice(0, allowedDamageParts.size).map((part) => {
    if (!part || typeof part !== "object" || Array.isArray(part)) throw new InputError("Hasar haritasındaki parça bilgisi geçersiz.");
    const item = part as Record<string, unknown>;
    if (typeof item.id !== "string" || !allowedDamageParts.has(item.id)
      || typeof item.status !== "string" || !allowedDamageStatuses.includes(item.status as (typeof allowedDamageStatuses)[number])) {
      throw new InputError("Hasar haritasındaki parça durumu geçersiz.");
    }
    return { id: item.id, status: item.status };
  });

  if (data.features !== undefined && (typeof data.features !== "object" || data.features === null || Array.isArray(data.features))) {
    throw new InputError("Donanım özellikleri geçersiz.");
  }
  const features: Record<string, string[]> = {};
  for (const [group, list] of Object.entries((data.features ?? {}) as Record<string, unknown>)) {
    if (!allowedFeatureGroups.has(group)) throw new InputError("Donanım özellik grubu geçersiz.");
    if (!Array.isArray(list)) throw new InputError("Donanım özellik listesi geçersiz.");
    const cleaned = list.slice(0, 60).map((item) => cleanText(item, 60)).filter(Boolean);
    if (cleaned.length) features[group] = [...new Set(cleaned)];
  }

  if (data.featureNotes !== undefined && (typeof data.featureNotes !== "object" || data.featureNotes === null || Array.isArray(data.featureNotes))) {
    throw new InputError("Donanım notları geçersiz.");
  }
  const featureNotes: Record<string, string> = {};
  for (const [group, note] of Object.entries((data.featureNotes ?? {}) as Record<string, unknown>)) {
    if (!allowedFeatureGroups.has(group)) throw new InputError("Donanım notu grubu geçersiz.");
    const cleaned = cleanText(note, 300);
    if (cleaned) featureNotes[group] = cleaned;
  }

  if (data.tires !== undefined && !Array.isArray(data.tires)) throw new InputError("Lastik bilgisi geçersiz.");
  const seenTirePositions = new Set<string>();
  const tires = (Array.isArray(data.tires) ? data.tires : []).map((tire) => {
    if (!tire || typeof tire !== "object" || Array.isArray(tire)) throw new InputError("Lastik bilgisi geçersiz.");
    const item = tire as Record<string, unknown>;
    const position = cleanText(item.position, 20);
    if (!allowedTirePositions.has(position)) throw new InputError("Lastik konumu geçersiz.");
    if (seenTirePositions.has(position)) throw new InputError("Aynı lastik için birden fazla kayıt girilemez.");
    seenTirePositions.add(position);
    const size = cleanText(item.size, 30);
    const tireStatus = cleanText(item.status, 80);
    const note = cleanText(item.note, 200);
    if (!size && !tireStatus && !note) return null;
    return { position, size, status: tireStatus, ...(note ? { note } : {}) };
  }).filter((tire) => tire !== null);

  return {
    brand, model, series, trim, subTrim, title, year, mileage, price,
    fuel: cleanText(data.fuel, 40),
    transmission: cleanText(data.transmission, 40),
    bodyType: cleanText(data.bodyType, 50),
    engineVolume: cleanText(data.engineVolume, 30),
    enginePower: cleanText(data.enginePower, 30),
    drive: cleanText(data.drive, 40),
    color: cleanText(data.color, 50),
    vehicleCondition: cleanText(data.vehicleCondition, 40),
    from: cleanText(data.from, 40),
    trade: data.trade === true,
    sahibindenUrl: cleanSahibindenUrl(data.sahibindenUrl),
    damageParts,
    features,
    featureNotes,
    tires,
    description: cleanText(data.description, 10000),
    imageUrls,
    status,
    featured: Boolean(data.featured) && data.heavyDamage !== true,
    heavyDamage: data.heavyDamage === true,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getAdminDb().collection("vehicles").limit(100).get();
    return NextResponse.json({ vehicles: snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const vehicle = validateVehicle(await request.json());
    const document = await getAdminDb().collection("vehicles").add({ ...vehicle, createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ id: document.id }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const id = cleanText(body?.id, 128);
    if (!id) throw new InputError("Düzenlenecek ilan seçilmedi.");
    const reference = getAdminDb().collection("vehicles").doc(id);
    const existing = await reference.get();
    if (!existing.exists) return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
    await reference.set(validateVehicle(body), { merge: true });
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const id = cleanText(body?.id, 128);
    if (!id) throw new InputError("Silinecek ilan seçilmedi.");
    const reference = getAdminDb().collection("vehicles").doc(id);
    const existing = await reference.get();
    if (!existing.exists) return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
    await reference.delete();
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
