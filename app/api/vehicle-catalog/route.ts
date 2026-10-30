import { NextResponse } from "next/server";
import { apiError, getAdminDb } from "@/lib/firebase-admin";
import { defaultVehicleCatalog, normalizeVehicleCatalog } from "@/lib/vehicle-catalog";

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection("siteSettings").doc("vehicleCatalog").get();
    const catalog = snapshot.exists ? normalizeVehicleCatalog(snapshot.data()) : defaultVehicleCatalog;
    return NextResponse.json({ catalog }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
