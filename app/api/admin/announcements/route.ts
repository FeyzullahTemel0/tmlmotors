import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { apiError, getAdminApp, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";
import { describeCriteria } from "@/lib/announcements";
import { isMailConfigured, sendBulkMail } from "@/lib/mailer";

const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[ \t]+/g, " ").trim().slice(0, max) : "";
}

function normalizePhone(value: unknown): string {
  const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
  if (!digits) return "";
  const international = digits.startsWith("90") && digits.length === 12 ? digits : digits.startsWith("0") && digits.length === 11 ? `9${digits}` : digits.length === 10 ? `90${digits}` : "";
  return international;
}

function price(value: unknown, label: string): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1_000_000_000) throw new InputError(`${label} geçersiz.`);
  return Math.round(number);
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getAdminDb().collection("announcements").orderBy("createdAt", "desc").limit(100).get();
    const announcements = snapshot.docs.map((document) => {
      const data = document.data();
      return { id: document.id, title: String(data.title ?? ""), message: String(data.message ?? ""), createdAt: millis(data.createdAt), emailSent: Number(data.emailSent ?? 0), businessName: String(data.businessName ?? "") };
    });
    return NextResponse.json({ announcements, mailConfigured: await isMailConfigured() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

async function emailRecipients(): Promise<string[]> {
  const db = getAdminDb();
  const optedOut = new Set((await db.collection("notificationState").where("emailEnabled", "==", false).get()).docs.map((document) => document.id));
  const emails: string[] = [];
  let pageToken: string | undefined;
  do {
    const page = await getAuth(getAdminApp()).listUsers(1000, pageToken);
    page.users.forEach((user) => {
      if (user.email && !user.disabled && !optedOut.has(user.uid)) emails.push(user.email);
    });
    pageToken = page.pageToken;
  } while (pageToken && emails.length < 5000);
  return emails;
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json() as Record<string, unknown> | null;
    const title = text(body?.title, 120);
    const message = text(body?.message, 2000);
    if (title.length < 3) throw new InputError("Duyuru başlığı gereklidir.");
    if (message.length < 10) throw new InputError("Duyuru metni en az 10 karakter olmalıdır.");
    const minPrice = price(body?.minPrice, "En düşük fiyat");
    const maxPrice = price(body?.maxPrice, "En yüksek fiyat");
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) throw new InputError("En düşük fiyat, en yüksek fiyattan büyük olamaz.");
    const criteria = { brand: text(body?.brand, 60), model: text(body?.model, 80), bodyType: text(body?.bodyType, 40), minPrice, maxPrice };
    const businessName = text(body?.businessName, 80);
    const phone = businessName ? normalizePhone(body?.phone) : "";
    if (businessName && body?.phone && !phone) throw new InputError("İletişim telefonu geçersiz.");

    const reference = await getAdminDb().collection("announcements").add({ title, message, ...criteria, businessName, phone, emailSent: 0, createdAt: FieldValue.serverTimestamp() });

    let mail = { configured: await isMailConfigured(), requested: body?.sendEmail !== false, sent: 0, failed: 0 };
    if (mail.requested && mail.configured) {
      const recipients = await emailRecipients();
      const result = await sendBulkMail({ subject: `Yeni duyuru: ${businessName ? `${businessName} - ` : ""}${title}`, heading: title, summary: [businessName, describeCriteria(criteria)].filter(Boolean).join(" · "), message, path: `/duyurular#${reference.id}` }, recipients);
      mail = { ...mail, ...result };
      await reference.update({ emailSent: result.sent });
    }
    return NextResponse.json({ id: reference.id, mail });
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
    await getAdminDb().collection("announcements").doc(id).delete();
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
