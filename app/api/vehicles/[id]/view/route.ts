import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, requireAdmin, requireAuthenticatedUser } from "@/lib/firebase-admin";

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

// Görüntülenme sayımı: ziyaretçi başına tek kayıt tutulur, her oturumda bir kez sayılır.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id || id.includes("/")) return NextResponse.json({ counted: false });
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const visitorId = cleanText(body?.visitorId, 64).replace(/[^a-zA-Z0-9_-]/g, "");

    let user: Awaited<ReturnType<typeof requireAuthenticatedUser>> | null = null;
    if (request.headers.get("authorization")) {
      try {
        user = await requireAuthenticatedUser(request);
      } catch {
        user = null;
      }
    }
    if (user) {
      try {
        await requireAdmin(request);
        return NextResponse.json({ counted: false });
      } catch {
        // Admin değil: normal ziyaretçi olarak sayılır.
      }
    }
    if (!user && !visitorId) return NextResponse.json({ counted: false });

    const db = getAdminDb();
    const vehicle = await db.collection("vehicles").doc(id).get();
    if (!vehicle.exists || vehicle.data()?.status !== "published") return NextResponse.json({ counted: false });

    const stats = db.collection("vehicleStats").doc(id);
    const viewer = stats.collection("viewers").doc(user ? user.uid : `v_${visitorId}`);
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(viewer);
      transaction.set(stats, {
        views: FieldValue.increment(1),
        ...(existing.exists ? {} : { uniqueViewers: FieldValue.increment(1) }),
        lastViewedAt: FieldValue.serverTimestamp(),
        vehicleTitle: cleanText(vehicle.data()?.title, 150),
      }, { merge: true });
      transaction.set(viewer, {
        uid: user?.uid ?? "",
        userName: user ? cleanText(user.name, 80) || "TML MOTORS üyesi" : "",
        userEmail: user ? cleanText(user.email, 120) : "",
        count: FieldValue.increment(1),
        lastViewedAt: FieldValue.serverTimestamp(),
        ...(existing.exists ? {} : { firstViewedAt: FieldValue.serverTimestamp() }),
      }, { merge: true });
    });
    return NextResponse.json({ counted: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
