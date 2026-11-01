import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAuthenticatedUser } from "@/lib/firebase-admin";

const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/[ \t]+/g, " ").trim().slice(0, maxLength) : "";
}

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection("reviews").where("status", "==", "approved").limit(200).get();
    const reviews = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          name: String(data.name ?? ""),
          rating: Number(data.rating ?? 0),
          comment: String(data.comment ?? ""),
          reply: String(data.adminReply ?? ""),
          createdAt: millis(data.createdAt),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
    return NextResponse.json({ reviews, summary: { count: reviews.length, average: Math.round(average * 10) / 10 } }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

// Kullanıcı başına tek yorum tutulur; güncelleme yeniden onaya düşer.
export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json() as Record<string, unknown> | null;
    const rating = Number(body?.rating);
    const comment = cleanText(body?.comment, 600);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new InputError("Lütfen 1 ile 5 arasında bir puan seçin.");
    if (comment.length < 10) throw new InputError("Yorumunuz en az 10 karakter olmalıdır.");
    const name = cleanText(body?.name, 60) || cleanText(user.name, 60) || "TML MOTORS müşterisi";
    const reference = getAdminDb().collection("reviews").doc(user.uid);
    const existing = await reference.get();
    await reference.set({
      uid: user.uid,
      email: cleanText(user.email, 120),
      name,
      rating,
      comment,
      status: "pending",
      adminReply: existing.exists ? String(existing.data()?.adminReply ?? "") : "",
      createdAt: existing.exists ? existing.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
