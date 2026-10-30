"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type UserCredential,
} from "firebase/auth";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { getFirebaseAuth, getFirebaseConnectionStatus } from "@/lib/firebase-client";
import { checkIsAdmin } from "@/lib/use-auth-status";
import { usePreferences } from "@/lib/i18n/preferences-context";

type AuthMode = "signin" | "signup";

function mapAuthError(error: unknown, googleMessage: string): string {
  const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
  if (message.includes("auth/popup-closed-by-user")) return "Giriş penceresi kapatıldı. Tekrar deneyin.";
  if (message.includes("auth/popup-blocked")) return "Tarayıcınız açılır pencereyi engelledi. Bu site için açılır pencerelere izin verin.";
  if (message.includes("auth/unauthorized-domain")) return "Google girişi bu alan adı için etkin değil. Alan adı Firebase yetkili alan adlarına eklenmelidir.";
  if (message.includes("auth/account-exists-with-different-credential")) return "Bu e-posta farklı bir yöntemle kayıtlı. E-posta ve şifre ile giriş yapın.";
  if (message.includes("auth/invalid-credential")) return "E-posta veya şifre hatalı.";
  if (message.includes("auth/email-already-in-use")) return "Bu e-posta adresi zaten kullanılıyor.";
  if (message.includes("auth/weak-password")) return "Şifreniz en az 6 karakter olmalıdır.";
  if (message.includes("auth/network-request-failed")) return "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.";
  if (message.includes("Google")) return googleMessage;
  return message;
}

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.9-5.1l-3.9 3C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.1 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-3.9-3C.4 8.2 0 10 0 12s.4 3.8 1.2 5.3l3.9-3z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C16.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.2 6.7l3.9 3c1-3 3.7-5 6.9-5z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = usePreferences();
  const firebaseStatus = useMemo(() => getFirebaseConnectionStatus(), []);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function finishSignIn(credential: UserCredential) {
    const isAdmin = await checkIsAdmin(() => credential.user.getIdToken(true));
    setSuccessMessage(isAdmin ? t("signInSuccessAdmin") : t("signInSuccessProfile"));
    router.push(isAdmin ? "/admin" : "/profil");
  }

  async function handleGoogle() {
    setErrorMessage("");
    setSuccessMessage("");
    if (!firebaseStatus.ready) {
      setErrorMessage(firebaseStatus.message);
      return;
    }
    try {
      setIsSaving(true);
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      await finishSignIn(credential);
    } catch (error) {
      setErrorMessage(mapAuthError(error, t("googleError")));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!firebaseStatus.ready) {
      setErrorMessage(firebaseStatus.message);
      return;
    }

    try {
      setIsSaving(true);
      const auth = getFirebaseAuth();

      if (mode === "signin") {
        const adminResponse = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const adminResult = (await adminResponse.json()) as { admin?: boolean; token?: string; error?: string };
        if (!adminResponse.ok) throw new Error(adminResult.error ?? "Giriş yapılamadı.");

        const credential = adminResult.admin && adminResult.token
          ? await signInWithCustomToken(auth, adminResult.token)
          : await signInWithEmailAndPassword(auth, email.trim(), password);
        await finishSignIn(credential);
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim().length > 0) {
        await updateProfile(credential.user, { displayName: displayName.trim() });
      }
      await sendEmailVerification(credential.user);
      await signOut(auth);
      setSuccessMessage(t("signUpSuccess"));
      setMode("signin");
    } catch (error) {
      setErrorMessage(mapAuthError(error, t("googleError")));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="container auth-shell">
        <aside className="auth-brand" aria-label="TML MOTORS">
          <div className="auth-brand-image" />
          <div className="auth-brand-overlay" />
          <div className="auth-brand-copy">
            <span className="eyebrow eyebrow-light"><MapPin size={14} /> GAZİANTEP · GÜNSEV OTO AVM</span>
            <h2>Önce güven,<br /><em>sonra doğru karar.</em></h2>
            <p>Hesabınızla beğendiğiniz yazıları kaydedin, profilinizi yönetin.</p>
            <div className="auth-brand-badge"><ShieldCheck size={15} /> Yetki Belge No: 2701072</div>
          </div>
        </aside>

        <div className="auth-panel">
          <span className="eyebrow">{t("membership")}</span>
          <h1>{mode === "signin" ? t("welcomeBack") : t("createAccount")}</h1>
          <p className="auth-subtitle">{t("loginSubtitle")}</p>

          <div className="auth-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "auth-tab is-active" : "auth-tab"} onClick={() => setMode("signin")}>{t("signIn")}</button>
            <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "auth-tab is-active" : "auth-tab"} onClick={() => setMode("signup")}>{t("register")}</button>
          </div>

          <button type="button" className="google-btn" onClick={handleGoogle} disabled={isSaving}>
            <GoogleMark /> {t("signInWithGoogle")}
          </button>

          <div className="auth-divider"><span>{t("orDivider")}</span></div>

          <form onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <>
                <label htmlFor="displayName">{t("fullName")}</label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  placeholder={t("fullName")}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  disabled={isSaving}
                />
              </>
            ) : null}

            <label htmlFor="email">{t("email")}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSaving}
              required
            />

            <label htmlFor="password">{t("password")}</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSaving}
              required
            />

            <button className="button button-primary" type="submit" disabled={isSaving}>
              {isSaving ? t("processing") : mode === "signin" ? t("signIn") : t("register")}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-switch">
            {mode === "signin" ? (
              <button type="button" onClick={() => setMode("signup")}>{t("switchToSignup")}</button>
            ) : (
              <button type="button" onClick={() => setMode("signin")}>{t("switchToSignin")}</button>
            )}
          </div>

          {errorMessage ? <div className="auth-notice auth-notice-error">{errorMessage}</div> : null}
          {successMessage ? <div className="auth-notice auth-notice-success">{successMessage}</div> : null}

          <p className="auth-alt-link">
            <Link className="text-link" href="/blog">{t("goToBlog")} <ArrowRight size={14} /></Link>
          </p>
        </div>
      </div>
    </section>
  );
}
