import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { apiError, getAdminApp, getAdminDb, InputError } from "@/lib/firebase-admin";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLocaleLowerCase("tr-TR"))
    .filter(Boolean);
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function throttleKey(request: Request, email: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${ip}|${email}`;
}

function isBlocked(key: string) {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (entry.resetAt < Date.now()) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(key: string) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < Date.now()) attempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
  else entry.count += 1;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLocaleLowerCase("tr-TR") : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) throw new InputError("E-posta ve şifre zorunludur.");

    // Admin dışındaki hesaplar normal Firebase girişini kullanır.
    if (!adminEmails().includes(email)) return NextResponse.json({ admin: false });

    const key = throttleKey(request, email);
    if (isBlocked(key)) {
      return NextResponse.json({ error: "Çok fazla hatalı deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin." }, { status: 429 });
    }

    const auth = getAuth(getAdminApp());
    const invalid = () => {
      registerFailure(key);
      return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
    };

    let uid: string;
    try {
      uid = (await auth.getUserByEmail(email)).uid;
    } catch {
      return invalid();
    }

    const snapshot = await getAdminDb().collection("users").doc(uid).get();
    const stored = snapshot.get("password");
    if (typeof stored !== "string" || stored.length === 0) return invalid();
    if (!timingSafeEqual(digest(stored), digest(password))) return invalid();

    attempts.delete(key);
    const token = await auth.createCustomToken(uid);
    return NextResponse.json({ admin: true, token });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
