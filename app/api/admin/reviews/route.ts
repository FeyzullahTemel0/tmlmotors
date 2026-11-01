import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";

const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getAdminDb().collection("reviews").limit(300).get();
    const reviews = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          name: String(data.name ?? ""),
          email: String(data.email ?? ""),
          rating: Number(data.rating ?? 0),
          comment: String(data.comment ?? ""),
          status: String(data.status ?? "pending"),
          reply: String(data.adminReply ?? ""),
          createdAt: millis(data.updatedAt ?? data.createdAt),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ reviews }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json() as Record<string, unknown> | null;
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id || id.includes("/")) throw new InputError("Geçersiz istek.");
    const update: Record<string, unknown> = { reviewedAt: FieldValue.serverTimestamp() };
    if (body?.status !== undefined) {
      if (body.status !== "approved" && body.status !== "pending" && body.status !== "hidden") throw new InputError("Geçersiz durum.");
      update.status = body.status;
    }
    if (typeof body?.reply === "string") update.adminReply = body.reply.trim().slice(0, 600);
    await getAdminDb().collection("reviews").doc(id).update(update);
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!id || id.includes("/")) throw new InputError("Geçersiz istek.");
    await getAdminDb().collection("reviews").doc(id).delete();
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
