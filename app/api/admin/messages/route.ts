import { NextResponse } from "next/server";
import { apiError, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function mapMessage(document: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = document.data();
  return {
    id: document.id,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    phone: String(data.phone ?? ""),
    message: String(data.message ?? ""),
    read: Boolean(data.read),
    createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getAdminDb().collection("contactMessages").limit(100).get();
    const messages = snapshot.docs
      .map(mapMessage)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    const unreadCount = messages.filter((item) => !item.read).length;
    return NextResponse.json({ messages, unreadCount }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json();
    const id = cleanText((body as Record<string, unknown> | null)?.id, 128);
    if (!id) throw new InputError("İşaretlenecek mesaj seçilmedi.");
    const reference = getAdminDb().collection("contactMessages").doc(id);
    const existing = await reference.get();
    if (!existing.exists) return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 });
    await reference.update({ read: true });
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json();
    const id = cleanText((body as Record<string, unknown> | null)?.id, 128);
    if (!id) throw new InputError("Silinecek mesaj seçilmedi.");
    const reference = getAdminDb().collection("contactMessages").doc(id);
    const existing = await reference.get();
    if (!existing.exists) return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 });
    await reference.delete();
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
