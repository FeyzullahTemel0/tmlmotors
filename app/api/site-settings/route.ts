import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";

const allowedKeys = ["instagram", "facebook", "youtube", "arabam", "sahibinden", "googleReview"] as const;

const defaultLinks = {
  sahibinden: "https://tmlmotors.sahibinden.com",
  youtube: "https://www.youtube.com/channel/UCrQn4SQSus6h0HZshp58yDA",
};

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection("siteSettings").doc("links").get();
    const stored = (snapshot.exists ? snapshot.data() : {}) as Record<string, unknown>;
    const links: Record<string, unknown> = { ...stored };
    for (const [key, value] of Object.entries(defaultLinks)) {
      if (!links[key]) links[key] = value;
    }
    return NextResponse.json({ links });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const links: Record<string, string> = {};
    for (const key of allowedKeys) {
      const value = typeof body?.[key] === "string" ? body[key].trim() : "";
      if (value && !/^https:\/\//i.test(value)) throw new InputError(`${key} bağlantısı https:// ile başlamalıdır.`);
      links[key] = value.slice(0, 1000);
    }
    await getAdminDb().collection("siteSettings").doc("links").set({ ...links, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ links });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
