import { NextResponse } from "next/server";
import { apiError, getAdminDb } from "@/lib/firebase-admin";

const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

// scope=normal (varsayılan): ağır hasarlı olmayan ilanlar, scope=damaged: yalnızca ağır hasarlı ilanlar,
// ids=a,b,c: karşılaştırma ve favori listeleri için (kapsam fark etmeksizin).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") === "damaged" ? "damaged" : "normal";
    const ids = (searchParams.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean).slice(0, 24);
    const db = getAdminDb();

    if (ids.length) {
      const documents = await Promise.all(ids.map((id) => db.collection("vehicles").doc(id).get()));
      const vehicles = documents
        .filter((document) => document.exists && document.data()?.status === "published")
        .map((document) => ({ id: document.id, ...document.data() }));
      return NextResponse.json({ vehicles }, { headers: { "Cache-Control": "no-store" } });
    }

    const snapshot = await db.collection("vehicles").where("status", "==", "published").limit(300).get();
    const vehicles = snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() } as { id: string; heavyDamage?: boolean; createdAt?: unknown }))
      .filter((vehicle) => (scope === "damaged") === (vehicle.heavyDamage === true))
      .sort((a, b) => millis(b.createdAt) - millis(a.createdAt))
      .slice(0, 100);
    return NextResponse.json({ vehicles }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
