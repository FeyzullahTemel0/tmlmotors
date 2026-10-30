"use client";

import { useEffect, useRef, useState } from "react";
import { Facebook, Instagram, Link2, Share2, Twitter } from "lucide-react";
import { usePreferences } from "@/lib/i18n/preferences-context";

type ShareMenuProps = {
  title: string;
  url?: string;
  path?: string;
  className?: string;
  label?: string;
};

export function ShareMenu({ title, url, path, className, label }: ShareMenuProps) {
  const { t } = usePreferences();
  const buttonLabel = label ?? t("shareLabel");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function shareUrl() {
    if (url) return url;
    if (path) return `${window.location.origin}${path}`;
    return window.location.href;
  }

  async function copyLink(source: string) {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(source);
      window.setTimeout(() => setCopied(""), 2400);
      setOpen(false);
    } catch {
      setCopied("");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url: shareUrl() });
      setOpen(false);
    } catch {
      // Kullanıcı paylaşım penceresini kapattı; sessizce geç.
    }
  }

  const encodedUrl = () => encodeURIComponent(shareUrl());
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="share-menu" ref={rootRef}>
      <button type="button" className={className ?? "engagement-action engagement-share"} aria-haspopup="menu" aria-expanded={open} aria-label={buttonLabel} title={buttonLabel} onClick={() => setOpen((value) => !value)}>
        <Share2 size={17} /><span className="engagement-action-label">{copied === "button" ? t("copied") : buttonLabel}</span>
      </button>
      {open ? (
        <div className="share-menu-pop" role="menu" aria-label={t("shareOptions")}>
          <a role="menuitem" href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl()}`)}`} target="_blank" rel="noopener noreferrer" className="share-option whatsapp">
            <WhatsAppIcon /> WhatsApp
          </a>
          <a role="menuitem" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl()}`} target="_blank" rel="noopener noreferrer" className="share-option">
            <Facebook size={16} /> Facebook
          </a>
          <a role="menuitem" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodedUrl()}`} target="_blank" rel="noopener noreferrer" className="share-option">
            <Twitter size={16} /> X (Twitter)
          </a>
          <button type="button" role="menuitem" className="share-option" onClick={() => void copyLink("instagram")}>
            <Instagram size={16} /> {copied === "instagram" ? t("copiedForInstagram") : t("copyForInstagram")}
          </button>
          <button type="button" role="menuitem" className="share-option" onClick={() => void copyLink("link")}>
            <Link2 size={16} /> {copied === "link" ? t("linkCopied") : t("copyLink")}
          </button>
          {canNativeShare ? (
            <button type="button" role="menuitem" className="share-option" onClick={() => void nativeShare()}>
              <Share2 size={16} /> {t("moreApps")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.16L2 22l4.97-1.6A9.9 9.9 0 1 0 12.04 2Zm0 1.67a8.23 8.23 0 1 1-4.2 15.3l-.3-.18-2.95.95.96-2.87-.2-.3a8.23 8.23 0 0 1 6.7-12.9Zm-3.4 4.18c-.19 0-.5.07-.75.35-.26.28-.99.96-.99 2.35s1.01 2.72 1.15 2.9c.14.19 1.97 3 4.84 4.2 2.4 1 2.88.8 3.4.76.53-.05 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.33-.28-.14-1.7-.84-1.96-.93-.26-.1-.45-.14-.64.14-.19.28-.74.92-.9 1.11-.17.19-.34.21-.62.07a7.6 7.6 0 0 1-2.23-1.38 8.3 8.3 0 0 1-1.54-1.92c-.16-.28 0-.43.12-.56.12-.12.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.49-.07-.14-.62-1.55-.88-2.12-.22-.54-.45-.49-.64-.5l-.64-.06Z" />
    </svg>
  );
}
