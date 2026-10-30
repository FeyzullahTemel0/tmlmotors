import { NextResponse } from "next/server";
import { apiError, getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection("vehicles")
      .where("status", "==", "published")
      .limit(200)
      .get();
    const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    const vehicles = snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() } as { id: string; featured?: boolean; createdAt?: unknown }))
      .sort((a, b) => millis(b.createdAt) - millis(a.createdAt))
      .slice(0, 100);
    return NextResponse.json({ vehicles }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
