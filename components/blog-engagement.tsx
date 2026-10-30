"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Bookmark, Heart } from "lucide-react";
import { getFirebaseAuth, getFirebaseConnectionStatus } from "@/lib/firebase-client";
import { ShareMenu } from "@/components/share-menu";
import { usePreferences } from "@/lib/i18n/preferences-context";

type EngagementState = {
  likes: number;
  saves: number;
  liked: boolean;
  saved: boolean;
};

const emptyEngagement: EngagementState = { likes: 0, saves: 0, liked: false, saved: false };

export function BlogEngagement({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const { t } = usePreferences();
  const firebaseStatus = getFirebaseConnectionStatus();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [engagement, setEngagement] = useState(emptyEngagement);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"like" | "save" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!firebaseStatus.ready) {
      setLoading(false);
      setAuthReady(true);
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, [firebaseStatus.ready]);

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    async function load() {
      setLoading(true);
      setErrorMessage("");
      try {
        const token = user ? await user.getIdToken() : "";
        const response = await fetch(`/api/blog/${encodeURIComponent(slug)}/engagement`, {
          cache: "no-store",
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Gönderi etkileşimleri alınamadı.");
        if (active) setEngagement(result as EngagementState);
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : "Etkileşimler alınamadı.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [authReady, slug, user]);

  async function setInteraction(type: "like" | "save") {
    if (!user) {
      router.push("/giris");
      return;
    }

    const enabled = type === "like" ? !engagement.liked : !engagement.saved;
    setSaving(type);
    setErrorMessage("");
    setNotice("");
    try {
      const response = await fetch(`/api/blog/${encodeURIComponent(slug)}/engagement`, {
        method: "POST",
        headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type, enabled }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "İşleminiz kaydedilemedi.");
      setEngagement((current) => ({
        ...current,
        likes: type === "like" ? current.likes + (enabled ? 1 : -1) : current.likes,
        saves: type === "save" ? current.saves + (enabled ? 1 : -1) : current.saves,
        liked: type === "like" ? enabled : current.liked,
        saved: type === "save" ? enabled : current.saved,
      }));
      setNotice(type === "like"
        ? enabled ? t("likeSaved") : t("likeRemoved")
        : enabled ? t("saveAdded") : t("saveRemoved"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "İşleminiz kaydedilemedi.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="blog-engagement">
      <div className="blog-engagement-actions">
        <button
          type="button"
          className={engagement.liked ? "engagement-action is-active" : "engagement-action"}
          aria-pressed={engagement.liked}
          aria-label={engagement.liked ? "Beğeniyi kaldır" : "Gönderiyi beğen"}
          disabled={loading || saving !== null}
          onClick={() => void setInteraction("like")}
        >
          <Heart size={18} fill={engagement.liked ? "currentColor" : "none"} />
          <span>{loading ? "…" : engagement.likes}</span>
          <span className="engagement-action-label">{t("likeLabel")}</span>
        </button>
        <button
          type="button"
          className={engagement.saved ? "engagement-action is-saved" : "engagement-action"}
          aria-pressed={engagement.saved}
          aria-label={engagement.saved ? "Kaydedilenlerden çıkar" : "Daha sonra okumak için kaydet"}
          disabled={loading || saving !== null}
          onClick={() => void setInteraction("save")}
        >
          <Bookmark size={18} fill={engagement.saved ? "currentColor" : "none"} />
          <span>{loading ? "…" : engagement.saves}</span>
          <span className="engagement-action-label">{engagement.saved ? t("savedLabel") : t("saveLabel")}</span>
        </button>
        <ShareMenu title={title} path={`/blog/${encodeURIComponent(slug)}`} />
        {!user && authReady ? <Link className="engagement-login" href="/giris">{t("engagementLogin")}</Link> : null}
      </div>
      {errorMessage ? <p className="engagement-feedback is-error" role="status">{errorMessage}</p> : null}
      {notice ? <p className="engagement-feedback" role="status">{notice}</p> : null}
      {!firebaseStatus.ready ? <p className="engagement-feedback">{t("engagementUnavailable")}</p> : null}
    </div>
  );
}
