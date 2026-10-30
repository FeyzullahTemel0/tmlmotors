"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Phone, RotateCw } from "lucide-react";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="state-page">
      <div className="container state-page-inner">
        <span className="state-code">Hata</span>
        <h1>Sayfa şu anda yüklenemedi.</h1>
        <p>Geçici bir sorun oluştu. Birkaç saniye sonra tekrar deneyebilirsiniz. Sorun devam ederse bizi arayın, size yardımcı olalım.</p>
        <div className="state-actions">
          <button type="button" className="button button-primary" onClick={() => retry()}>Tekrar dene <RotateCw size={16} /></button>
          <Link className="state-link" href="/">Ana sayfa</Link>
          <a className="state-link" href="tel:+905535781136"><Phone size={16} /> +90 553 578 11 36</a>
        </div>
      </div>
    </section>
  );
}
