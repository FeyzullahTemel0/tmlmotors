import { NextResponse } from "next/server";
import { apiError, getAdminDb } from "@/lib/firebase-admin";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "İlan kimliği gerekli." }, { status: 400 });
    const snapshot = await getAdminDb().collection("vehicles").doc(id).get();
    if (!snapshot.exists || snapshot.data()?.status !== "published") return NextResponse.json({ error: "Yayındaki ilan bulunamadı." }, { status: 404 });
    return NextResponse.json({ vehicle: { id: snapshot.id, ...snapshot.data() } }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}