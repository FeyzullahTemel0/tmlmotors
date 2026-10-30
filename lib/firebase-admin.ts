import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON ortam değişkeni tanımlı değil.");

  try {
    return JSON.parse(raw) as { project_id: string; client_email: string; private_key: string };
  } catch (error) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON geçerli JSON değil.", { cause: error });
  }
}

export function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const account = getServiceAccount();
  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON içinde project_id, client_email ve private_key zorunludur.");
  }

  return initializeApp({
    credential: cert({
      projectId: account.project_id,
      clientEmail: account.client_email,
      privateKey: account.private_key.replace(/\\n/g, "\n"),
    }),
  });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export async function requireAuthenticatedUser(request: Request): Promise<DecodedIdToken> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new Error("UNAUTHENTICATED: Giriş yapmanız gerekiyor.");

  const auth = getAuth(getAdminApp());
  try {
    return await auth.verifyIdToken(token);
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "";
    if (["auth/argument-error", "auth/id-token-expired", "auth/invalid-id-token", "auth/invalid-credential", "auth/tenant-id-mismatch"].includes(code)) {
      throw new Error("UNAUTHENTICATED: Oturum doğrulanamadı. Lütfen yeniden giriş yapın.");
    }
    throw error;
  }
}

export async function requireAdmin(request: Request): Promise<DecodedIdToken> {
  const decoded = await requireAuthenticatedUser(request);
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLocaleLowerCase("tr-TR"))
    .filter(Boolean);

  const email = decoded.email?.toLocaleLowerCase("tr-TR");
  if (!decoded.email_verified || !email || !adminEmails.includes(email)) {
    throw new Error("FORBIDDEN: Bu işlem için doğrulanmış admin hesabı gerekir.");
  }

  return decoded;
}

export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Beklenmeyen sunucu hatası.";
  const status = error instanceof InputError
    ? 400
    : error instanceof SyntaxError
      ? 400
      : message.startsWith("UNAUTHENTICATED:")
        ? 401
        : message.startsWith("FORBIDDEN:")
          ? 403
          : message.startsWith("SERVICE_UNAVAILABLE:") || message.includes("FIREBASE_SERVICE_ACCOUNT_JSON")
            ? 503
            : 500;

  if (status === 500) console.error("API isteği başarısız oldu:", error);
  const errorMessage = status === 500
    ? "İstek tamamlanamadı. Lütfen daha sonra tekrar deneyin."
    : status === 503
      ? "Sunucu bağlantı ayarları eksik veya kullanılamıyor. Lütfen site yöneticisiyle iletişime geçin."
      : message.replace(/^(UNAUTHENTICATED|FORBIDDEN|SERVICE_UNAVAILABLE): /, "");
  return { status, error: errorMessage };
}
