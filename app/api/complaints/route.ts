import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAuthenticatedUser } from "@/lib/firebase-admin";

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
    const user = await requireAuthenticatedUser(request);
    const snapshot = await getAdminDb().collection("complaints").where("userId", "==", user.uid).limit(50).get();
    const complaints = snapshot.docs
      .map(mapComplaint)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return NextResponse.json({ complaints }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new InputError("Şikayet bilgisi geçersiz.");
    const data = body as Record<string, unknown>;
    const vehicleId = cleanText(data.vehicleId, 128);
    const message = cleanText(data.message, 1000);
    if (!vehicleId) throw new InputError("Şikayet edilecek ilan seçilmedi.");
    if (message.length < 10) throw new InputError("Şikayetinizi en az 10 karakterle açıklayın.");

    const db = getAdminDb();
    const vehicle = await db.collection("vehicles").doc(vehicleId).get();
    if (!vehicle.exists) throw new InputError("İlgili araç ilanı bulunamadı.");
    const vehicleTitle = String(vehicle.data()?.title ?? "") || "Araç ilanı";

    const duplicate = await db.collection("complaints")
      .where("userId", "==", user.uid)
      .where("vehicleId", "==", vehicleId)
      .where("status", "==", "open")
      .limit(1)
      .get();
    if (!duplicate.empty) throw new InputError("Bu ilan için zaten değerlendirilmeyi bekleyen bir şikayetiniz var.");

    const reference = await db.collection("complaints").add({
      vehicleId,
      vehicleTitle,
      userId: user.uid,
      userName: cleanText(user.name, 80) || "TML MOTORS üyesi",
      userEmail: cleanText(user.email, 120),
      message,
      status: "open",
      adminReply: "",
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: reference.id }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
