import type { ReactNode } from "react";

export function LegalPage({ eyebrow, title, intro, updated, children }: { eyebrow: string; title: string; intro: string; updated: string; children: ReactNode }) {
  return (
    <>
      <section className="subpage-hero"><div className="container">
        <span className="eyebrow eyebrow-light">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div></section>
      <section className="legal-page"><article className="legal-body">
        <p className="legal-meta">Son güncelleme: {updated}</p>
        <div className="legal-callout"><b>Önemli:</b> TML MOTORS sitesi üzerinden hiçbir hizmet, ilan, rezervasyon veya değerleme için ödeme istenmez. Ödeme talep eden mesaj veya aramalara itibar etmeyin ve +90 553 578 11 36 numarasından bize bildirin.</div>
        {children}
      </article></section>
    </>
  );
}
