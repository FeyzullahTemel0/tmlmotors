import { NextResponse } from "next/server";
import { apiError, getAdminDb } from "@/lib/firebase-admin";
import { adPlacementIds, legacyAdPlacements, type PublicAd } from "@/lib/ad-placements";

export async function GET(request: Request) {
  try {
    const placement = new URL(request.url).searchParams.get("placement") ?? "";
    if (!adPlacementIds.includes(placement)) return NextResponse.json({ error: "Geçersiz reklam konumu." }, { status: 400 });

    const snapshot = await getAdminDb().collection("ads").where("active", "==", true).limit(100).get();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
    const ads: PublicAd[] = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          business: String(data.business ?? ""),
          title: String(data.title ?? ""),
          description: String(data.description ?? ""),
          url: String(data.url ?? ""),
          imageUrl: String(data.imageUrl ?? ""),
          placements: Array.isArray(data.placements) && data.placements.length ? (data.placements as string[]) : legacyAdPlacements,
          priority: Number(data.priority) || 0,
          startDate: String(data.startDate ?? ""),
          endDate: String(data.endDate ?? ""),
        };
      })
      .filter((ad) => ad.placements.includes(placement) && (!ad.startDate || ad.startDate <= today) && (!ad.endDate || ad.endDate >= today))
      .sort((a, b) => b.priority - a.priority)
      .map(({ startDate: _start, endDate: _end, ...ad }) => ad);

    return NextResponse.json({ ads }, { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
