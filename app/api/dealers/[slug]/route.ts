import { NextResponse } from "next/server";
import { apiError, getAdminDb } from "@/lib/firebase-admin";
import { publicDealer } from "@/lib/dealer-server";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const snapshot = await getAdminDb().collection("dealers").where("slug", "==", slug).limit(1).get();
    const document = snapshot.docs[0];
    if (!document || document.data().active !== true) return NextResponse.json({ error: "Galerici profili bulunamadı." }, { status: 404 });
    return NextResponse.json({ dealer: publicDealer(document.data()) }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
