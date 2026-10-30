import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function mapComplaint(document: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = document.data();
  return {
    id: document.id,
    vehicleId: String(data.vehicleId ?? ""),
    vehicleTitle: String(data.vehicleTitle ?? ""),
    userId: String(data.userId ?? ""),
    userName: String(data.userName ?? ""),
    userEmail: String(data.userEmail ?? ""),
    message: String(data.message ?? ""),
    status: data.status === "answered" ? "answered" : "open",
    adminReply: String(data.adminReply ?? ""),
    createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
    repliedAt: data.repliedAt?.toDate?.().toISOString() ?? null,
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getAdminDb().collection("complaints").limit(100).get();
    const complaints = snapshot.docs
      .map(mapComplaint)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    const openCount = complaints.filter((item) => item.status === "open").length;
    return NextResponse.json({ complaints, openCount }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new InputError("Şikayet bilgisi geçersiz.");
    const data = body as Record<string, unknown>;
    const id = cleanText(data.id, 128);
    const adminReply = cleanText(data.adminReply, 1000);
    if (!id) throw new InputError("Yanıtlanacak şikayet seçilmedi.");
    if (adminReply.length < 10) throw new InputError("Yanıtınız en az 10 karakter olmalıdır.");

    const reference = getAdminDb().collection("complaints").doc(id);
    const existing = await reference.get();
    if (!existing.exists) return NextResponse.json({ error: "Şikayet bulunamadı." }, { status: 404 });
    await reference.update({
      adminReply,
      status: "answered",
      repliedAt: FieldValue.serverTimestamp(),
    });
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
    if (!id) throw new InputError("Silinecek şikayet seçilmedi.");
    const reference = getAdminDb().collection("complaints").doc(id);
    const existing = await reference.get();
    if (!existing.exists) return NextResponse.json({ error: "Şikayet bulunamadı." }, { status: 404 });
    await reference.delete();
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
