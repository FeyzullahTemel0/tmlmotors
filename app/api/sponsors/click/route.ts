import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id.trim().slice(0, 128) : "";
    if (!id) return NextResponse.json({ error: "Reklam bulunamadı." }, { status: 400 });
    const reference = getAdminDb().collection("ads").doc(id);
    const snapshot = await reference.get();
    if (!snapshot.exists || snapshot.data()?.active !== true) return NextResponse.json({ error: "Reklam bulunamadı." }, { status: 404 });
    await reference.update({ clicks: FieldValue.increment(1) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
