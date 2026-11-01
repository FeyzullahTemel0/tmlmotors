import nodemailer from "nodemailer";
import { getSiteUrl } from "@/lib/site-url";
import { getAdminDb } from "@/lib/firebase-admin";

export type MailSettings = { host: string; port: number; user: string; pass: string; from: string };

// "private" koleksiyonu güvenlik kurallarında istemciye kapalıdır; yalnızca sunucu okur.
export const mailSettingsRef = () => getAdminDb().collection("private").doc("mail");

// Önce admin panelinde kaydedilen ayar, yoksa ortam değişkenleri kullanılır.
export async function getMailSettings(): Promise<(MailSettings & { source: "panel" | "env" }) | null> {
  try {
    const data = (await mailSettingsRef().get()).data();
    if (data?.host && data?.user && data?.pass) {
      return { host: String(data.host), port: Number(data.port) || 465, user: String(data.user), pass: String(data.pass), from: String(data.from || data.user), source: "panel" };
    }
  } catch {
    // Okunamazsa ortam değişkenlerine düşülür.
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 465, user: process.env.SMTP_USER, pass: process.env.SMTP_PASS, from: process.env.MAIL_FROM || process.env.SMTP_USER, source: "env" };
  }
  return null;
}

export async function isMailConfigured(): Promise<boolean> {
  return Boolean(await getMailSettings());
}

function createTransporter(settings: MailSettings) {
  return nodemailer.createTransport({ host: settings.host, port: settings.port, secure: settings.port === 465, auth: { user: settings.user, pass: settings.pass }, connectionTimeout: 15000 });
}

export async function verifyMailSettings(settings: MailSettings): Promise<void> {
  await createTransporter(settings).verify();
}

export async function sendTestMail(settings: MailSettings, to: string): Promise<void> {
  await createTransporter(settings).sendMail({
    from: settings.from,
    to,
    subject: "TML MOTORS e-posta testi",
    text: "E-posta ayarlarınız doğru çalışıyor. Duyurular bu adresten kullanıcılara gönderilecek.",
  });
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type BulkMail = { subject: string; heading: string; summary: string; message: string; path: string };

function renderMail({ heading, summary, message, path }: BulkMail) {
  const url = `${getSiteUrl()}${path}`;
  const text = `${heading}\n${summary ? `${summary}\n` : ""}\n${message}\n\nDetaylar: ${url}\n\nBu e-postayı TML MOTORS üyesi olduğunuz için aldınız. Bildirim e-postalarını Profil > Ayarlar bölümünden kapatabilirsiniz.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f1ea;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e4dfd2">
<div style="background:#111;color:#e8d3a8;padding:18px 24px;font-weight:700;letter-spacing:.08em">TML MOTORS</div>
<div style="padding:24px">
<h2 style="margin:0 0 8px;font-size:20px;color:#151515">${escapeHtml(heading)}</h2>
${summary ? `<p style="margin:0 0 14px;color:#8a6a35;font-weight:700">${escapeHtml(summary)}</p>` : ""}
<p style="margin:0 0 22px;color:#3a3c39;line-height:1.7;white-space:pre-line">${escapeHtml(message)}</p>
<a href="${url}" style="display:inline-block;background:#c8a05a;color:#111;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">Duyuruyu görüntüle</a>
</div>
<div style="padding:14px 24px;border-top:1px solid #eee;color:#8a8d86;font-size:12px;line-height:1.6">Bu e-postayı TML MOTORS üyesi olduğunuz için aldınız. Bildirim e-postalarını site içinde Profil &gt; Ayarlar bölümünden kapatabilirsiniz. TML MOTORS hiçbir işlem için sizden ödeme istemez.</div>
</div></div>`;
  return { text, html };
}

// Alıcılar gizli kopya (BCC) ile gruplar halinde gönderilir; böylece adresler birbirini görmez.
export async function sendBulkMail(mail: BulkMail, recipients: string[]): Promise<{ sent: number; failed: number }> {
  const settings = await getMailSettings();
  if (!settings || !recipients.length) return { sent: 0, failed: recipients.length };
  const transporter = createTransporter(settings);
  const from = settings.from;
  const { text, html } = renderMail(mail);
  let sent = 0;
  let failed = 0;
  for (let index = 0; index < recipients.length; index += 40) {
    const batch = recipients.slice(index, index + 40);
    try {
      await transporter.sendMail({ from, to: settings.user, bcc: batch, subject: mail.subject, text, html });
      sent += batch.length;
    } catch {
      failed += batch.length;
    }
  }
  return { sent, failed };
}
