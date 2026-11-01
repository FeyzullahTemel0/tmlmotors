"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signOut, type User } from "firebase/auth";
import { ArrowRight, ArrowUpRight, Bookmark, Building2, Camera, Check, CircleUserRound, Coins, Flag, Heart, KeyRound, Languages, LogOut, MailCheck, MailWarning, Scale, Settings, ShieldCheck, Trash2, X } from "lucide-react";
import { ProfileVehicles } from "@/components/profile-vehicles";
import { DealerProfileEditor, useIsDealer } from "@/components/dealer-profile-editor";
import { useVehicleCollections } from "@/lib/vehicle-collections";
import { useAuthStatus } from "@/lib/use-auth-status";
import { getPublishedBlogPosts, type BlogPost } from "@/lib/blog-service";
import { getFirebaseAuth, getFirebaseConnectionStatus } from "@/lib/firebase-client";
import { getUserProfile, saveUserProfile } from "@/lib/profile-service";
import { Loading } from "@/components/loading";
import { plainText } from "@/lib/blog-content";
import { currencyOptions, languages } from "@/lib/i18n/translations";
import { usePreferences } from "@/lib/i18n/preferences-context";

async function uploadAvatarToCloudinary(file: File, user: User): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Yalnızca görsel dosyaları yüklenebilir.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Profil fotoğrafı en fazla 5 MB olabilir.");

  const token = await user.getIdToken();
  const signatureResponse = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ category: "profile" }),
  });
  const signatureData = await signatureResponse.json();
  if (!signatureResponse.ok) throw new Error(signatureData.error ?? "Cloudinary imzası alınamadı.");

  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", signatureData.apiKey);
  formData.set("timestamp", String(signatureData.timestamp));
  formData.set("signature", signatureData.signature);
  formData.set("folder", signatureData.folder);
  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`, { method: "POST", body: formData });
  const uploadData = await uploadResponse.json();
  if (!uploadResponse.ok) throw new Error(uploadData.error?.message ?? "Profil fotoğrafı yüklenemedi.");
  if (typeof uploadData.secure_url !== "string") throw new Error("Cloudinary görsel adresi dönmedi.");
  return uploadData.secure_url;
}

type UserComplaint = {
  id: string; vehicleId: string; vehicleTitle: string; message: string;
  status: "open" | "answered"; adminReply: string; createdAt: string | null; repliedAt: string | null;
};

type ProfileTab = "saved" | "favorites" | "compare" | "business" | "reports" | "settings";

function initials(name: string, email: string): string {
  const source = (name || email || "T").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "T";
}

export default function ProfilePage() {
  const router = useRouter();
  const { t, language, setLanguage, currency, setCurrency } = usePreferences();
  const { favoriteIds, compareIds } = useVehicleCollections();
  const firebaseStatus = useMemo(() => getFirebaseConnectionStatus(), []);
  const [user, setUser] = useState<User | null>(null);
  const isDealer = useIsDealer(user);
  const { isAdmin } = useAuthStatus();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("saved");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savedBlogSlugs, setSavedBlogSlugs] = useState<string[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<BlogPost[]>([]);
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailNotifications, setEmailNotifications] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested === "saved" || requested === "favorites" || requested === "compare" || requested === "business" || requested === "reports" || requested === "settings") setTab(requested);
  }, []);

  async function handleEmailNotifications(enabled: boolean) {
    if (!user) return;
    const previous = emailNotifications;
    setEmailNotifications(enabled);
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ emailEnabled: enabled }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setEmailNotifications(previous);
      setErrorMessage("Bildirim tercihi kaydedilemedi.");
    }
  }

  useEffect(() => {
    if (!firebaseStatus.ready) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (nextUser) => {
      setUser(nextUser);
      setErrorMessage("");
      setSuccessMessage("");
      if (!nextUser) {
        setLoading(false);
        return;
      }

      try {
        const existingProfile = await getUserProfile(nextUser.uid);
        setDisplayName(existingProfile?.displayName || nextUser.displayName || "");
        setAvatarUrl(existingProfile?.avatarUrl || nextUser.photoURL || "");
        setSavedBlogSlugs(existingProfile?.savedBlogSlugs ?? []);
        setPublishedPosts(await getPublishedBlogPosts());
        const complaintsResponse = await fetch("/api/complaints", {
          headers: { Authorization: `Bearer ${await nextUser.getIdToken()}` },
        });
        if (complaintsResponse.ok) {
          const complaintsData = await complaintsResponse.json();
          setComplaints(complaintsData.complaints ?? []);
        }
        const notificationsResponse = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${await nextUser.getIdToken()}` }, cache: "no-store" });
        if (notificationsResponse.ok) setEmailNotifications((await notificationsResponse.json()).emailEnabled !== false);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Profil bilgileri alınamadı.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [firebaseStatus.ready]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const savedPosts = useMemo(
    () => publishedPosts.filter((post) => savedBlogSlugs.includes(post.slug)),
    [publishedPosts, savedBlogSlugs],
  );
  const hasPasswordLogin = Boolean(user?.providerData.some((provider) => provider.providerId === "password"));
  const memberSince = user?.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(language === "tr" ? "tr-TR" : language, { year: "numeric", month: "long" })
    : "";

  async function persistProfile(next: { displayName?: string; avatarUrl?: string }) {
    if (!user) return;
    await saveUserProfile({
      uid: user.uid,
      email: user.email ?? "",
      displayName: (next.displayName ?? displayName).trim(),
      avatarUrl: next.avatarUrl ?? avatarUrl,
      savedBlogSlugs,
    });
  }

  async function removeSavedPost(slug: string) {
    if (!user) return;
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
      const response = await fetch(`/api/blog/${encodeURIComponent(slug)}/engagement`, {
        method: "POST",
        headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "save", enabled: false }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Kaydetme tercihiniz güncellenemedi.");
      setSavedBlogSlugs((previous) => previous.filter((item) => item !== slug));
      setSuccessMessage("Yazı kayıtlılarınızdan çıkarıldı.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kaydetme tercihiniz güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!user) {
      setErrorMessage("Profil fotoğrafı yüklemek için önce giriş yapmalısınız.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
      const url = await uploadAvatarToCloudinary(file, user);
      await persistProfile({ avatarUrl: url });
      setAvatarUrl(url);
      setSuccessMessage(t("photoUploaded"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Profil fotoğrafı yüklenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveAvatar() {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
      await persistProfile({ avatarUrl: "" });
      setAvatarUrl("");
      setSuccessMessage(t("profileSaved"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Profil kaydı yapılamadı.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile() {
    if (!user) {
      setErrorMessage("Profilinizi kaydetmek için giriş yapmalısınız.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
      await persistProfile({});
      setSuccessMessage(t("profileSaved"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Profil kaydı yapılamadı.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendVerification() {
    if (!user) return;
    try {
      setErrorMessage("");
      setSuccessMessage("");
      await sendEmailVerification(user);
      setSuccessMessage(t("verificationSent"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Doğrulama e-postası gönderilemedi.");
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    try {
      setErrorMessage("");
      setSuccessMessage("");
      await sendPasswordResetEmail(getFirebaseAuth(), user.email);
      setSuccessMessage(t("resetSent"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Şifre sıfırlama bağlantısı gönderilemedi.");
    }
  }

  async function handleSignOut() {
    try {
      await signOut(getFirebaseAuth());
      router.push("/giris");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Çıkış yapılamadı.");
    }
  }

  if (!firebaseStatus.ready) {
    return <section className="auth-wrap"><div className="auth-card"><span className="eyebrow"><CircleUserRound size={15} /> {t("personalArea")}</span><h1>{t("profileTitle")}</h1><div className="auth-notice auth-notice-error">{firebaseStatus.message}</div><p><Link className="text-link" href="/giris">{t("goToLogin")}</Link></p></div></section>;
  }
  if (loading) return <section className="auth-wrap"><Loading label={t("profileLoading")} /></section>;
  if (!user) return <section className="auth-wrap"><div className="auth-card"><span className="eyebrow"><CircleUserRound size={15} /> {t("personalArea")}</span><h1>{t("profileTitle")}</h1><p>{t("loginRequired")}</p><p><Link className="text-link" href="/giris">{t("goToLogin")}</Link></p></div></section>;

  const tabs: Array<{ id: ProfileTab; label: string; count?: number; icon: typeof Bookmark }> = [
    { id: "saved", label: t("tabSaved"), count: savedPosts.length, icon: Bookmark },
    { id: "favorites", label: "Favori ilanlar", count: favoriteIds.length, icon: Heart },
    { id: "compare", label: "Karşılaştırma", count: compareIds.length, icon: Scale },
    ...(isDealer ? [{ id: "business" as const, label: "İşletme profilim", icon: Building2 }] : []),
    { id: "reports", label: t("myComplaints"), count: complaints.length, icon: Flag },
    { id: "settings", label: t("tabSettings"), icon: Settings },
  ];

  return (
    <section className="pf-page">
      <div className="container">
        <header className="pf-card pf-hero">
          <div className="pf-cover" aria-hidden="true" />
          <div className="pf-hero-body">
            <div className="pf-avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt={`${displayName || "Profil"} fotoğrafı`} />
                : <span>{initials(displayName, user.email ?? "")}</span>}
              <button type="button" className="pf-avatar-edit" aria-label={t("change")} onClick={() => fileInputRef.current?.click()} disabled={saving}><Camera size={15} /></button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} disabled={saving} className="pf-file" />
            </div>
            <div className="pf-identity">
              <h1>{displayName || t("profileTitle")}</h1>
              <p className="pf-email">{user.email}</p>
              <div className="pf-chips">
                <span className={user.emailVerified ? "pf-chip is-ok" : "pf-chip is-warn"}>
                  {user.emailVerified ? <MailCheck size={13} /> : <MailWarning size={13} />}
                  {user.emailVerified ? t("emailVerified") : t("emailNotVerified")}
                </span>
                {isAdmin ? <span className="pf-chip is-admin"><ShieldCheck size={13} /> {t("admin")}</span> : null}
              </div>
            </div>
            <div className="pf-hero-actions">
              {isAdmin ? <Link className="button button-primary" href="/admin">{t("adminPanel")} <ArrowRight size={15} /></Link> : null}
              <button type="button" className="pf-ghost" onClick={handleSignOut}><LogOut size={14} /> {t("signOut")}</button>
            </div>
          </div>
          <dl className="pf-stats">
            <div><dd>{savedPosts.length}</dd><dt>{t("statSaved")}</dt></div>
            <div><dd>{favoriteIds.length}</dd><dt>Favori ilan</dt></div>
            <div><dd>{complaints.length}</dd><dt>{t("statReports")}</dt></div>
            <div><dd className="is-text">{memberSince || "—"}</dd><dt>{t("memberSince")}</dt></div>
          </dl>
        </header>

        {errorMessage ? <div className="auth-notice auth-notice-error pf-notice" role="alert">{errorMessage}</div> : null}
        {successMessage ? <div className="auth-notice auth-notice-success pf-notice" role="status">{successMessage}</div> : null}

        <nav className="pf-tabs" role="tablist" aria-label={t("profileTitle")}>
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "pf-tab is-active" : "pf-tab"} onClick={() => setTab(item.id)}>
                <Icon size={16} />
                <span>{item.label}</span>
                {typeof item.count === "number" && item.count > 0 ? <em>{item.count}</em> : null}
              </button>
            );
          })}
        </nav>

        {tab === "saved" ? (
          <section className="pf-card pf-panel" role="tabpanel" aria-label={t("savedPosts")}>
            {savedPosts.length ? (
              <div className="pf-saved-grid">
                {savedPosts.map((post) => (
                  <article className="pf-saved" key={post.id}>
                    <Link href={`/blog/${post.slug}`} className="pf-saved-media" style={post.coverImageUrl ? { backgroundImage: `url("${post.coverImageUrl}")` } : undefined} aria-label={post.title}>
                      {!post.coverImageUrl ? <Bookmark size={20} strokeWidth={1.5} /> : null}
                    </Link>
                    <div className="pf-saved-body">
                      <b>{post.title}</b>
                      <p>{plainText(post.excerpt)}</p>
                      <div className="pf-saved-actions">
                        <Link href={`/blog/${post.slug}`} className="text-link">{t("read")} <ArrowUpRight size={13} /></Link>
                        <button type="button" className="pf-link-danger" onClick={() => removeSavedPost(post.slug)} disabled={saving}><Trash2 size={13} /> {t("removeSaved")}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="pf-empty">
                <Bookmark size={22} strokeWidth={1.4} />
                <p>{t("savedPostsEmpty")}</p>
                <Link className="text-link" href="/blog">{t("allPosts")} <ArrowRight size={14} /></Link>
              </div>
            )}
          </section>
        ) : null}

        {tab === "favorites" ? <ProfileVehicles kind="favorites" /> : null}
        {tab === "compare" ? <ProfileVehicles kind="compare" /> : null}
        {tab === "business" && isDealer ? <DealerProfileEditor user={user} /> : null}

        {tab === "reports" ? (
          <section className="pf-card pf-panel" role="tabpanel" aria-label={t("myComplaints")}>
            {complaints.length ? (
              <ul className="pf-reports">
                {complaints.map((item) => (
                  <li className="pf-report" key={item.id}>
                    <div className="pf-report-head">
                      <Link href={`/araclar/${item.vehicleId}`} className="text-link"><b>{item.vehicleTitle}</b></Link>
                      <span className={item.status === "answered" ? "pf-chip is-ok" : "pf-chip is-warn"}>
                        {item.status === "answered" ? t("complaintStatusAnswered") : t("complaintStatusOpen")}
                      </span>
                    </div>
                    <p>{item.message}</p>
                    <small>{item.createdAt ? new Date(item.createdAt).toLocaleString(language === "tr" ? "tr-TR" : language) : ""}</small>
                    {item.adminReply ? (
                      <div className="pf-reply">
                        <b>TML MOTORS</b>
                        <p>{item.adminReply}</p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="pf-empty">
                <Flag size={22} strokeWidth={1.4} />
                <p>{t("complaintsEmpty")}</p>
              </div>
            )}
          </section>
        ) : null}

        {tab === "settings" ? (
          <div className="pf-settings" role="tabpanel" aria-label={t("tabSettings")}>
            <section className="pf-card pf-panel">
              <h2>{t("accountInfo")}</h2>
              <label htmlFor="displayName">{t("fullName")}</label>
              <input id="displayName" type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={saving} placeholder={t("fullName")} autoComplete="name" />
              <label htmlFor="pfEmail">{t("email")}</label>
              <input id="pfEmail" type="text" value={user.email ?? ""} readOnly disabled />
              <label>{t("profilePhoto")}</label>
              <div className="pf-photo-row">
                <button type="button" className="pf-ghost" onClick={() => fileInputRef.current?.click()} disabled={saving}><Camera size={14} /> {avatarUrl ? t("change") : t("profilePhoto")}</button>
                {avatarUrl ? <button type="button" className="pf-ghost" onClick={handleRemoveAvatar} disabled={saving}><X size={14} /> {t("removePhoto")}</button> : <span className="pf-muted">{t("noPhoto")}</span>}
              </div>
              <button className="button button-primary pf-save" type="button" onClick={handleSaveProfile} disabled={saving}>{saving ? t("saving") : t("saveProfile")}</button>
            </section>

            <section className="pf-card pf-panel">
              <h2>{t("securityTitle")}</h2>
              <div className="pf-row">
                <div>
                  <b>{user.email}</b>
                  <span className={user.emailVerified ? "pf-chip is-ok" : "pf-chip is-warn"}>
                    {user.emailVerified ? <MailCheck size={13} /> : <MailWarning size={13} />}
                    {user.emailVerified ? t("emailVerified") : t("emailNotVerified")}
                  </span>
                </div>
                {!user.emailVerified ? <button type="button" className="pf-ghost" onClick={handleSendVerification}><MailCheck size={14} /> {t("resendVerification")}</button> : null}
              </div>
              {hasPasswordLogin ? (
                <div className="pf-row">
                  <div><b>{t("password")}</b></div>
                  <button type="button" className="pf-ghost" onClick={handlePasswordReset}><KeyRound size={14} /> {t("resetPassword")}</button>
                </div>
              ) : null}
            </section>

            <section className="pf-card pf-panel">
              <h2>Bildirimler</h2>
              <div className="pf-row">
                <div><b>Duyuru e-postaları</b><span className="pf-muted">Yeni duyurular e-posta adresinize de gönderilsin.</span></div>
                <button type="button" role="switch" aria-checked={emailNotifications !== false} className={emailNotifications !== false ? "pf-option is-active" : "pf-option"} disabled={emailNotifications === null} onClick={() => void handleEmailNotifications(emailNotifications === false)}>
                  {emailNotifications !== false ? "Açık" : "Kapalı"}
                </button>
              </div>
              <Link href="/bildirimler" className="text-link">Bildirimlerimi görüntüle <ArrowRight size={14} /></Link>
            </section>

            <section className="pf-card pf-panel">
              <h2>{t("preferencesTitle")}</h2>
              <label><Languages size={14} /> {t("language")}</label>
              <div className="pf-options">
                {languages.map((item) => (
                  <button key={item.code} type="button" className={language === item.code ? "pf-option is-active" : "pf-option"} onClick={() => setLanguage(item.code)}>
                    {language === item.code ? <Check size={13} /> : null}{item.label}
                  </button>
                ))}
              </div>
              <label><Coins size={14} /> {t("currency")}</label>
              <div className="pf-options">
                {currencyOptions.map((item) => (
                  <button key={item.code} type="button" className={currency === item.code ? "pf-option is-active" : "pf-option"} onClick={() => setCurrency(item.code)}>
                    {currency === item.code ? <Check size={13} /> : null}<b>{item.symbol}</b> {item.code}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </section>
  );
}
