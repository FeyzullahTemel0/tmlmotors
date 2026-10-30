import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError } from "@/lib/firebase-admin";

const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < Date.now()) {
    attempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > 5;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new InputError("Mesaj bilgisi geçersiz.");
    const data = body as Record<string, unknown>;

    // Gizli alan doluysa bot kabul edilir; başarılı gibi yanıtlanıp kayıt atlanır.
    if (cleanText(data.website, 200)) return NextResponse.json({ success: true }, { status: 201 });

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (isRateLimited(ip)) throw new InputError("Çok sık mesaj gönderildi. Lütfen biraz sonra tekrar deneyin.");

    const name = cleanText(data.name, 80);
    const email = cleanText(data.email, 120);
    const phone = cleanText(data.phone, 24);
    const message = cleanText(data.message, 1500);
    if (!name) throw new InputError("Adınızı yazın.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError("Geçerli bir e-posta adresi yazın.");
    if (message.length < 10) throw new InputError("Mesajınız en az 10 karakter olmalıdır.");

    await getAdminDb().collection("contactMessages").add({
      name, email, phone, message, read: false, createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
