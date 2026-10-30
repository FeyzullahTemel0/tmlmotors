import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";
import { adPlacementIds } from "@/lib/ad-placements";

const clean = (value: unknown, length: number) => typeof value === "string" ? value.trim().slice(0, length) : "";
const isHttps = (value: string) => /^https:\/\//i.test(value);
const isDate = (value: string) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value);

function parseAd(body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  const title = clean(input.title, 100);
  const business = clean(input.business, 120);
  const url = clean(input.url, 1000);
  const imageUrl = clean(input.imageUrl, 1000);
  const startDate = clean(input.startDate, 10);
  const endDate = clean(input.endDate, 10);
  const placements = Array.isArray(input.placements)
    ? Array.from(new Set(input.placements.filter((item): item is string => typeof item === "string" && adPlacementIds.includes(item))))
    : [];
  const priority = Math.min(100, Math.max(0, Math.round(Number(input.priority) || 0)));

  if (!business || !url) throw new InputError("İşletme adı ve yönlendirme bağlantısı zorunludur.");
  if (!title && !imageUrl) throw new InputError("Başlık girin ya da banner görseli yükleyin.");
  if (!isHttps(url)) throw new InputError("Yönlendirme bağlantısı https:// ile başlamalıdır.");
  if (imageUrl && !isHttps(imageUrl)) throw new InputError("Banner görseli https:// adresi olmalıdır.");
  if (!placements.length) throw new InputError("Reklamın gösterileceği en az bir konum seçin.");
  if (!isDate(startDate) || !isDate(endDate)) throw new InputError("Tarih biçimi geçersiz.");
  if (startDate && endDate && startDate > endDate) throw new InputError("Bitiş tarihi başlangıç tarihinden önce olamaz.");

  return {
    title, business, url, imageUrl, placements, priority, startDate, endDate,
    description: clean(input.description, 240),
    sponsorNote: clean(input.sponsorNote, 600),
    active: Boolean(input.active),
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getAdminDb().collection("ads").limit(200).get();
    const ads = snapshot.docs.map((document) => {
      const data = document.data();
      return { id: document.id, ...data, createdAt: data.createdAt?.toDate?.().toISOString() ?? null, updatedAt: data.updatedAt?.toDate?.().toISOString() ?? null };
    });
    return NextResponse.json({ ads });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const data = parseAd(await request.json());
    const result = await getAdminDb().collection("ads").add({
      ...data, clicks: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const id = clean(body?.id, 128);
    if (!id) throw new InputError("Düzenlenecek reklam seçilmedi.");
    const data = parseAd(body);
    const reference = getAdminDb().collection("ads").doc(id);
    if (!(await reference.get()).exists) return NextResponse.json({ error: "Reklam kaydı bulunamadı." }, { status: 404 });
    await reference.set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
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
    const id = clean(body?.id, 128);
    if (!id) throw new InputError("Silinecek reklam seçilmedi.");
    const reference = getAdminDb().collection("ads").doc(id);
    if (!(await reference.get()).exists) return NextResponse.json({ error: "Reklam kaydı bulunamadı." }, { status: 404 });
    await reference.delete();
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
