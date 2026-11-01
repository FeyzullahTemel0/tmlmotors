import { NextResponse } from "next/server";
import { apiError, getAdminDb } from "@/lib/firebase-admin";
import { publicDealer } from "@/lib/dealer-server";

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection("dealers").where("active", "==", true).limit(100).get();
    const dealers = snapshot.docs
      .map((document) => publicDealer(document.data()))
      .filter((dealer) => dealer.businessName && dealer.slug)
      .sort((a, b) => a.businessName.localeCompare(b.businessName, "tr-TR"));
    return NextResponse.json({ dealers }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
