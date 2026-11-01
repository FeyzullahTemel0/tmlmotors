"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "tml-cookie-notice";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!window.localStorage.getItem(KEY));
    } catch {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;
  return (
    <div className="cookie-banner" role="region" aria-label="Çerez bilgilendirmesi">
      <span>Sitemizde yalnızca çalışması için gerekli çerez ve yerel depolama kullanılır; reklam veya takip çerezi yoktur. <Link href="/cerez-politikasi">Ayrıntılar</Link></span>
      <button type="button" onClick={() => { window.localStorage.setItem(KEY, "1"); setVisible(false); }}>Anladım</button>
    </div>
  );
}
