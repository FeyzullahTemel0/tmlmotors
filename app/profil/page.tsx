"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { ArrowRight, ArrowUpRight, BadgeCheck, Bookmark, CircleUserRound, Flag, LogOut, MailCheck, MailWarning, PenLine, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { useAuthStatus } from "@/lib/use-auth-status";
import { getPublishedBlogPosts, type BlogPost } from "@/lib/blog-service";
import { getFirebaseAuth, getFirebaseConnectionStatus } from "@/lib/firebase-client";
import { getUserProfile, saveUserProfile, type UserProfile } from "@/lib/profile-service";
import { Loading } from "@/components/loading";
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

function initials(name: string, email: string): string {
  const source = (name || email || "T").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "T";
}

export default function ProfilePage() {
  const router = useRouter();
  const { t, language } = usePreferences();
  const firebaseStatus = useMemo(() => getFirebaseConnectionStatus(), []);
  const [user, setUser] = useState<User | null>(null);
  const { isAdmin } = useAuthStatus();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savedBlogSlugs, setSavedBlogSlugs] = useState<string[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<BlogPost[]>([]);
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Profil bilgileri alınamadı.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [firebaseStatus.ready]);

  const savedPosts = useMemo(
    () => publishedPosts.filter((post) => savedBlogSlugs.includes(post.slug)),
    [publishedPosts, savedBlogSlugs],
  );

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
    if (!file) return;
    if (!user) {
      setErrorMessage("Profil fotoğrafı yüklemek için önce giriş yapmalısınız.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
      setAvatarUrl(await uploadAvatarToCloudinary(file, user));
      setSuccessMessage(t("photoUploaded"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Profil fotoğrafı yüklenemedi.");
    } finally {
      setSaving(false);
      event.target.value = "";
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
      const payload: UserProfile = {
        uid: user.uid,
        email: user.email ?? "",
        displayName: displayName.trim(),
        avatarUrl,
        savedBlogSlugs,
      };
      await saveUserProfile(payload);
      setSuccessMessage(t("profileSaved"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Profil kaydı yapılamadı.");
    } finally {
      setSaving(false);
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

  return (
    <section className="profile-page">
      <div className="container">
        <div className="profile-hero">
          <div className="profile-hero-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt={`${displayName || "Profil"} fotoğrafı`} />
              : <span>{initials(displayName, user.email ?? "")}</span>}
            <button type="button" className="profile-hero-edit" aria-label={t("change")} onClick={() => fileInputRef.current?.click()} disabled={saving}><PenLine size={15} /></button>
          </div>
          <div className="profile-hero-info">
            <span className="eyebrow"><CircleUserRound size={14} /> {t("personalArea")}</span>
            <h1>{displayName || t("profileTitle")}</h1>
            <div className="profile-hero-meta">
              <span>{user.email}</span>
              <span className={user.emailVerified ? "profile-chip is-ok" : "profile-chip is-warn"}>
                {user.emailVerified ? <MailCheck size={13} /> : <MailWarning size={13} />}
                {user.emailVerified ? t("emailVerified") : t("emailNotVerified")}
              </span>
              {isAdmin ? <span className="profile-chip is-admin"><ShieldCheck size={13} /> {t("admin")}</span> : null}
            </div>
          </div>
          <div className="profile-hero-actions">
            {isAdmin ? <Link className="button button-primary" href="/admin">{t("adminPanel")} <ArrowRight size={15} /></Link> : null}
            <button type="button" className="inline-control" onClick={handleSignOut}><LogOut size={14} /> {t("signOut")}</button>
          </div>
        </div>

        <div className="profile-grid">
          <section className="profile-section" aria-label={t("profilePhoto")}>
            <div className="profile-section-head"><h2><BadgeCheck size={16} /> {t("profileTitle")}</h2></div>
            <label htmlFor="displayName">{t("fullName")}</label>
            <input id="displayName" type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={saving} placeholder={t("fullName")} />
            <label>{t("profilePhoto")}</label>
            <input ref={fileInputRef} id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} disabled={saving} className="profile-file-input" />
            <div className="profile-photo-row">
              <button type="button" className="inline-control" onClick={() => fileInputRef.current?.click()} disabled={saving}><Upload size={14} /> {avatarUrl ? t("change") : t("profilePhoto")}</button>
              {avatarUrl ? <button type="button" className="inline-control" onClick={() => setAvatarUrl("")} disabled={saving}><X size={14} /> {t("removePhoto")}</button> : null}
            </div>
            {!avatarUrl ? <div className="profile-placeholder"><Upload size={16} /><span>{t("noPhoto")}</span></div> : null}
            <button className="button button-primary" type="button" onClick={handleSaveProfile} disabled={saving}>{saving ? t("saving") : t("saveProfile")}</button>
            {errorMessage ? <div className="auth-notice auth-notice-error">{errorMessage}</div> : null}
            {successMessage ? <div className="auth-notice auth-notice-success">{successMessage}</div> : null}
          </section>

          <section className="profile-section" aria-label={t("savedPosts")}>
            <div className="profile-section-head"><h2><Bookmark size={16} /> {t("savedPosts")}</h2><span className="profile-count">{savedPosts.length}</span></div>
            {savedPosts.length ? (
              <div className="saved-post-grid">
                {savedPosts.map((post) => (
                  <article className="saved-post-card" key={post.id}>
                    <Link href={`/blog/${post.slug}`} className="saved-post-media" style={post.coverImageUrl ? { backgroundImage: `url("${post.coverImageUrl}")` } : undefined} aria-label={post.title}>
                      {!post.coverImageUrl ? <Bookmark size={20} strokeWidth={1.5} /> : null}
                    </Link>
                    <div className="saved-post-body">
                      <b>{post.title}</b>
                      <p>{post.excerpt}</p>
                      <div className="saved-post-actions">
                        <Link href={`/blog/${post.slug}`} className="text-link">{t("read")} <ArrowUpRight size={13} /></Link>
                        <button type="button" className="inline-control" onClick={() => removeSavedPost(post.slug)} disabled={saving}><Trash2 size={13} /> {t("removeSaved")}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="profile-empty">
                <Bookmark size={22} strokeWidth={1.4} />
                <p>{t("savedPostsEmpty")}</p>
                <Link className="text-link" href="/blog">{t("allPosts")} <ArrowRight size={14} /></Link>
              </div>
            )}
          </section>

          <section className="profile-section" aria-label={t("myComplaints")}>
            <div className="profile-section-head"><h2><Flag size={16} /> {t("myComplaints")}</h2><span className="profile-count">{complaints.length}</span></div>
            {complaints.length ? (
              <ul className="complaint-list">
                {complaints.map((item) => (
                  <li className="complaint-card" key={item.id}>
                    <div className="complaint-card-head">
                      <Link href={`/araclar/${item.vehicleId}`} className="text-link"><b>{item.vehicleTitle}</b></Link>
                      <span className={item.status === "answered" ? "profile-chip is-ok" : "profile-chip is-warn"}>
                        {item.status === "answered" ? t("complaintStatusAnswered") : t("complaintStatusOpen")}
                      </span>
                    </div>
                    <p className="complaint-message">{item.message}</p>
                    <small>{item.createdAt ? new Date(item.createdAt).toLocaleString(language === "tr" ? "tr-TR" : language) : ""}</small>
                    {item.adminReply ? (
                      <div className="complaint-reply">
                        <b>TML MOTORS</b>
                        <p>{item.adminReply}</p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="profile-empty">
                <Flag size={22} strokeWidth={1.4} />
                <p>{t("complaintsEmpty")}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
