import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { apiError, getAdminApp, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getAdminDb().collection("dealers").limit(200).get();
    const dealers = snapshot.docs.map((document) => {
      const data = document.data();
      return { uid: document.id, email: String(data.email ?? ""), active: data.active === true, businessName: String(data.businessName ?? ""), slug: String(data.slug ?? ""), photoCount: Array.isArray(data.photos) ? data.photos.length : 0 };
    });
    return NextResponse.json({ dealers }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

// Kayıtlı bir üyeyi e-posta adresiyle galerici olarak işaretler.
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json() as Record<string, unknown> | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new InputError("Geçerli bir e-posta adresi girin.");
    let uid: string;
    try {
      uid = (await getAuth(getAdminApp()).getUserByEmail(email)).uid;
    } catch {
      throw new InputError("Bu e-posta ile kayıtlı bir üye bulunamadı. Kişinin önce siteye üye olması gerekir.");
    }
    await getAdminDb().collection("dealers").doc(uid).set({ email, active: true, createdAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ uid, email });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json() as Record<string, unknown> | null;
    const uid = typeof body?.uid === "string" ? body.uid : "";
    if (!uid || uid.includes("/") || typeof body?.active !== "boolean") throw new InputError("Geçersiz istek.");
    await getAdminDb().collection("dealers").doc(uid).update({ active: body.active });
    return NextResponse.json({ uid, active: body.active });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const uid = new URL(request.url).searchParams.get("uid") ?? "";
    if (!uid || uid.includes("/")) throw new InputError("Geçersiz istek.");
    await getAdminDb().collection("dealers").doc(uid).delete();
    return NextResponse.json({ uid });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
