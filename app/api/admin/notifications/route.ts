import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getAdminDb();
    const [recent, unread] = await Promise.all([
      db.collection("adminNotifications").orderBy("createdAt", "desc").limit(50).get(),
      db.collection("adminNotifications").where("read", "==", false).count().get(),
    ]);
    const notifications = recent.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        type: data.type === "save" ? "save" : "like",
        postId: String(data.postId ?? ""),
        postSlug: String(data.postSlug ?? ""),
        postTitle: String(data.postTitle ?? ""),
        userName: String(data.userName ?? "TML MOTORS üyesi"),
        userEmail: String(data.userEmail ?? ""),
        read: Boolean(data.read),
        createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
      };
    });
    return NextResponse.json({ notifications, unreadCount: unread.data().count }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new InputError("Bildirim bilgisi geçersiz.");
    const id = (body as { id?: unknown }).id;
    if (typeof id !== "string" || !id.trim()) throw new InputError("Okundu olarak işaretlenecek bildirim seçilmedi.");
    await getAdminDb().collection("adminNotifications").doc(id).update({
      read: true,
      readAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
