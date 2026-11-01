import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError } from "@/lib/firebase-admin";

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

const allowedDamages = ["Hasar kaydı yok", "Boyalı parça var", "Lokal boyalı parça var", "Değişen parça var", "Tramer (hasar) kaydı var", "Ağır hasar kayıtlı", "Emin değilim"];

function cleanDamage(value: unknown): string {
  const items = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return allowedDamages.filter((option) => items.includes(option)).join(", ");
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown> | null;
    if (!body) throw new InputError("Form verisi okunamadı.");
    // Bot tuzağı: görünmeyen alan doluysa kayıt oluşturmadan başarılı döner.
    if (cleanText(body.website, 50)) return NextResponse.json({ ok: true });

    const name = cleanText(body.name, 80);
    const phone = cleanText(body.phone, 24);
    const brand = cleanText(body.brand, 60);
    const model = cleanText(body.model, 80);
    const year = Number(body.year);
    const mileage = Number(body.mileage);
    if (name.length < 2) throw new InputError("Lütfen adınızı girin.");
    if (phone.replace(/\D/g, "").length < 10) throw new InputError("Size ulaşabilmemiz için geçerli bir telefon numarası girin.");
    if (!brand || !model) throw new InputError("Marka ve model bilgisi gereklidir.");
    if (!Number.isInteger(year) || year < 1970 || year > new Date().getFullYear() + 1) throw new InputError("Model yılı geçersiz.");
    if (!Number.isFinite(mileage) || mileage < 0 || mileage > 2_000_000) throw new InputError("Kilometre bilgisi geçersiz.");
    if (body.consent !== true) throw new InputError("Devam etmek için aydınlatma metnini onaylamalısınız.");

    const expected = body.expectedPrice === "" || body.expectedPrice === null || body.expectedPrice === undefined ? null : Number(body.expectedPrice);
    if (expected !== null && (!Number.isFinite(expected) || expected < 0 || expected > 1_000_000_000)) throw new InputError("Beklenen fiyat geçersiz.");

    const db = getAdminDb();
    const recent = await db.collection("sellRequests").where("phone", "==", phone).limit(20).get();
    const now = Date.now();
    const burst = recent.docs.filter((document) => now - ((document.data().createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0) < 10 * 60 * 1000);
    if (burst.length >= 3) throw new InputError("Talebiniz alındı. Kısa süre içinde sizi arayacağız.");

    await db.collection("sellRequests").add({
      name,
      phone,
      city: cleanText(body.city, 60),
      brand,
      model,
      year,
      mileage,
      fuel: cleanText(body.fuel, 30),
      transmission: cleanText(body.transmission, 30),
      damage: cleanDamage(body.damage),
      expectedPrice: expected,
      note: cleanText(body.note, 800),
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
