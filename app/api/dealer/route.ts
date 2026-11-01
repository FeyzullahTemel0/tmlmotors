import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, requireAuthenticatedUser } from "@/lib/firebase-admin";
import { publicDealer, validateDealerProfile } from "@/lib/dealer-server";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const snapshot = await getAdminDb().collection("dealers").doc(user.uid).get();
    if (!snapshot.exists || snapshot.data()?.active !== true) return NextResponse.json({ isDealer: false, dealer: null });
    return NextResponse.json({ isDealer: true, dealer: publicDealer(snapshot.data() ?? {}) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const reference = getAdminDb().collection("dealers").doc(user.uid);
    const snapshot = await reference.get();
    if (!snapshot.exists || snapshot.data()?.active !== true) return NextResponse.json({ error: "Galerici profili bu hesap için etkin değil." }, { status: 403 });
    const profile = validateDealerProfile(await request.json() as Record<string, unknown> | null, user.uid, String(snapshot.data()?.slug ?? ""));
    await reference.set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ dealer: profile });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
