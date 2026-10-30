import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { apiError, getAdminApp, getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const adminEmail = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim()).filter(Boolean)[0];
    if (!adminEmail) return NextResponse.json({ avatarUrl: "", name: "TML MOTORS" });

    const auth = getAuth(getAdminApp());
    const adminUser = await auth.getUserByEmail(adminEmail);
    const profile = await getAdminDb().collection("users").doc(adminUser.uid).get();
    const avatarUrl = typeof profile.get("avatarUrl") === "string" ? String(profile.get("avatarUrl")) : "";

    return NextResponse.json(
      { avatarUrl, name: "TML MOTORS" },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
