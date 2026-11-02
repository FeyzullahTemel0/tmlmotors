import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { apiError, getAdminApp, getAdminDb, InputError, requireAuthenticatedUser } from "@/lib/firebase-admin";
import { describeCriteria } from "@/lib/announcements";

const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

type NotificationItem = { id: string; kind: "announcement" | "complaint"; title: string; message: string; link: string; createdAt: number; unread: boolean };

// Bildirim akışı: duyurular (herkese ortak) + kullanıcıya özel şikayet yanıtları.
// Okunma durumu tek bir "son okuma zamanı" ile tutulur; yeni üye kayıt öncesi duyuruları okunmamış saymaz.
export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const db = getAdminDb();
    const stateRef = db.collection("notificationState").doc(user.uid);
    const state = await stateRef.get();
    let lastReadAt = millis(state.data()?.lastReadAt);
    if (!lastReadAt) {
      const created = (await getAuth(getAdminApp()).getUser(user.uid)).metadata.creationTime;
      lastReadAt = created ? new Date(created).getTime() : Date.now();
      await stateRef.set({ lastReadAt: Timestamp.fromMillis(lastReadAt) }, { merge: true });
    }

    const [announcements, complaints] = await Promise.all([
      db.collection("announcements").orderBy("createdAt", "desc").limit(30).get(),
      db.collection("complaints").where("userId", "==", user.uid).limit(50).get(),
    ]);

    const items: NotificationItem[] = [];
    announcements.docs.forEach((document) => {
      const data = document.data();
      const createdAt = millis(data.createdAt);
      const criteria = describeCriteria({ brand: String(data.brand ?? ""), model: String(data.model ?? ""), bodyType: String(data.bodyType ?? ""), minPrice: typeof data.minPrice === "number" ? data.minPrice : null, maxPrice: typeof data.maxPrice === "number" ? data.maxPrice : null });
      const businessName = String(data.businessName ?? "");
      items.push({ id: `a_${document.id}`, kind: "announcement", title: businessName ? `${businessName}: ${String(data.title ?? "")}` : String(data.title ?? ""), message: criteria || String(data.message ?? "").slice(0, 140), link: `/duyurular#${document.id}`, createdAt, unread: createdAt > lastReadAt });
    });
    complaints.docs.forEach((document) => {
      const data = document.data();
      const repliedAt = millis(data.repliedAt);
      if (!data.adminReply || !repliedAt) return;
      items.push({ id: `c_${document.id}`, kind: "complaint", title: "Şikayetinize yanıt verildi", message: String(data.vehicleTitle ?? ""), link: "/profil?tab=reports", createdAt: repliedAt, unread: repliedAt > lastReadAt });
    });
    items.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({
      items: items.slice(0, 40),
      unread: items.filter((item) => item.unread).length,
      serverTime: Date.now(),
      emailEnabled: state.data()?.emailEnabled !== false,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

// Bildirim ekranı açıldığında çağrılır: gösterilen zamana kadar her şey okundu sayılır.
export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json() as Record<string, unknown> | null;
    const until = Math.min(Number(body?.until) || Date.now(), Date.now());
    const ref = getAdminDb().collection("notificationState").doc(user.uid);
    const current = millis((await ref.get()).data()?.lastReadAt);
    if (until > current) await ref.set({ lastReadAt: Timestamp.fromMillis(until) }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json() as Record<string, unknown> | null;
    if (typeof body?.emailEnabled !== "boolean") throw new InputError("Geçersiz istek.");
    await getAdminDb().collection("notificationState").doc(user.uid).set({ emailEnabled: body.emailEnabled }, { merge: true });
    return NextResponse.json({ emailEnabled: body.emailEnabled });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
