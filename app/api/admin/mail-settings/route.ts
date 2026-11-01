import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, InputError, requireAdmin } from "@/lib/firebase-admin";
import { getMailSettings, mailSettingsRef, sendTestMail, verifyMailSettings } from "@/lib/mailer";

const noStore = { "Cache-Control": "private, no-store" };

function fail(error: unknown) {
  const result = apiError(error);
  return NextResponse.json({ error: result.error }, { status: result.status });
}

// Şifre hiçbir zaman istemciye geri gönderilmez.
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const settings = await getMailSettings();
    return NextResponse.json(
      { configured: Boolean(settings), source: settings?.source ?? null, host: settings?.host ?? "", port: settings?.port ?? 465, user: settings?.user ?? "", from: settings?.from ?? "" },
      { headers: noStore },
    );
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json() as Record<string, unknown> | null;
    const host = String(body?.host ?? "").trim().slice(0, 120);
    const user = String(body?.user ?? "").trim().slice(0, 160);
    const from = String(body?.from ?? "").trim().slice(0, 200);
    const port = Number(body?.port);
    const typedPass = String(body?.pass ?? "").replace(/\s+/g, "");
    if (!host || !user) throw new InputError("Sunucu ve e-posta adresi gereklidir.");
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new InputError("Port geçersiz.");

    const existing = (await mailSettingsRef().get()).data();
    const pass = typedPass || String(existing?.pass ?? "");
    if (!pass) throw new InputError("Şifre gereklidir.");

    const settings = { host, port, user, pass, from: from || user };
    try {
      await verifyMailSettings(settings);
    } catch {
      throw new InputError("E-posta sunucusuna bağlanılamadı. Adres, port, e-posta ve uygulama şifresini kontrol edin.");
    }
    await mailSettingsRef().set({ ...settings, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}

// Kayıtlı ayarla, giriş yapmış admin'in kendi e-posta adresine deneme e-postası gönderir.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const settings = await getMailSettings();
    if (!settings) throw new InputError("Önce e-posta ayarlarını kaydedin.");
    if (!admin.email) throw new InputError("Hesabınızda e-posta adresi yok.");
    try {
      await sendTestMail(settings, admin.email);
    } catch {
      throw new InputError("Deneme e-postası gönderilemedi.");
    }
    return NextResponse.json({ ok: true, to: admin.email });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    await mailSettingsRef().delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
