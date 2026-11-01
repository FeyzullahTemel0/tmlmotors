import { NextResponse } from "next/server";
import { apiError, getAdminDb, requireAdmin } from "@/lib/firebase-admin";

const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getAdminDb();
    const vehicleId = new URL(request.url).searchParams.get("vehicleId");

    if (vehicleId) {
      if (vehicleId.includes("/")) return NextResponse.json({ viewers: [], favorites: [] });
      const [viewers, favorites] = await Promise.all([
        db.collection("vehicleStats").doc(vehicleId).collection("viewers").limit(300).get(),
        db.collection("vehicleFavorites").where("vehicleId", "==", vehicleId).limit(300).get(),
      ]);
      return NextResponse.json({
        viewers: viewers.docs
          .map((document) => {
            const data = document.data();
            return {
              id: document.id,
              registered: Boolean(data.uid),
              name: String(data.userName ?? ""),
              email: String(data.userEmail ?? ""),
              count: Number(data.count ?? 0),
              lastViewedAt: millis(data.lastViewedAt),
            };
          })
          .sort((a, b) => b.lastViewedAt - a.lastViewedAt),
        favorites: favorites.docs
          .map((document) => {
            const data = document.data();
            return { id: document.id, name: String(data.userName ?? ""), email: String(data.userEmail ?? ""), createdAt: millis(data.createdAt) };
          })
          .sort((a, b) => b.createdAt - a.createdAt),
      }, { headers: { "Cache-Control": "private, no-store" } });
    }

    const [vehicles, stats, favorites] = await Promise.all([
      db.collection("vehicles").limit(500).get(),
      db.collection("vehicleStats").limit(500).get(),
      db.collection("vehicleFavorites").limit(2000).get(),
    ]);
    const statById = new Map(stats.docs.map((document) => [document.id, document.data()]));
    const favoriteCount = new Map<string, number>();
    favorites.docs.forEach((document) => {
      const id = String(document.data().vehicleId ?? "");
      favoriteCount.set(id, (favoriteCount.get(id) ?? 0) + 1);
    });
    const items = vehicles.docs
      .map((document) => {
        const data = document.data();
        const stat = statById.get(document.id);
        return {
          id: document.id,
          title: String(data.title ?? ""),
          status: String(data.status ?? "draft"),
          heavyDamage: data.heavyDamage === true,
          views: Number(stat?.views ?? 0),
          uniqueViewers: Number(stat?.uniqueViewers ?? 0),
          favorites: favoriteCount.get(document.id) ?? 0,
          lastViewedAt: millis(stat?.lastViewedAt),
        };
      })
      .sort((a, b) => b.views - a.views || b.favorites - a.favorites);
    return NextResponse.json({
      items,
      totals: {
        views: items.reduce((sum, item) => sum + item.views, 0),
        favorites: items.reduce((sum, item) => sum + item.favorites, 0),
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
