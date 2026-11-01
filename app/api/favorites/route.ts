import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAuthenticatedUser } from "@/lib/firebase-admin";

const MAX_COMPARE = 3;
const MAX_FAVORITES = 200;

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const db = getAdminDb();
    const [favorites, list] = await Promise.all([
      db.collection("vehicleFavorites").where("uid", "==", user.uid).limit(MAX_FAVORITES).get(),
      db.collection("vehicleLists").doc(user.uid).get(),
    ]);
    const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    const ids = favorites.docs
      .map((document) => ({ id: String(document.data().vehicleId ?? ""), at: millis(document.data().createdAt) }))
      .filter((item) => item.id)
      .sort((a, b) => b.at - a.at)
      .map((item) => item.id);
    const compare = Array.isArray(list.data()?.compare)
      ? (list.data()?.compare as unknown[]).filter((item): item is string => typeof item === "string").slice(0, MAX_COMPARE)
      : [];
    return NextResponse.json({ favorites: ids, compare }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json() as Record<string, unknown> | null;
    const vehicleId = cleanText(body?.vehicleId, 128);
    if (!vehicleId || vehicleId.includes("/")) throw new InputError("İlan seçilmedi.");
    const db = getAdminDb();
    const reference = db.collection("vehicleFavorites").doc(`${user.uid}_${vehicleId}`);

    if (body?.enabled === false) {
      await reference.delete();
      return NextResponse.json({ vehicleId, enabled: false });
    }

    const vehicle = await db.collection("vehicles").doc(vehicleId).get();
    if (!vehicle.exists || vehicle.data()?.status !== "published") throw new InputError("Bu ilan artık yayında değil.");
    await reference.set({
      uid: user.uid,
      vehicleId,
      vehicleTitle: cleanText(vehicle.data()?.title, 150),
      userName: cleanText(user.name, 80) || "TML MOTORS üyesi",
      userEmail: cleanText(user.email, 120),
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ vehicleId, enabled: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json() as Record<string, unknown> | null;
    if (!Array.isArray(body?.compare)) throw new InputError("Karşılaştırma listesi geçersiz.");
    const compare = Array.from(new Set(body.compare.map((item) => cleanText(item, 128)).filter((id) => id && !id.includes("/")))).slice(0, MAX_COMPARE);
    await getAdminDb().collection("vehicleLists").doc(user.uid).set({ compare, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ compare });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
