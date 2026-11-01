import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { faqItems } from "@/lib/faq-data";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular",
  description: "TML MOTORS araç alım satım, değerleme, hasar bilgisi ve ödeme politikası hakkında sıkça sorulan sorular.",
  alternates: { canonical: "/sss" },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }} />
      <section className="subpage-hero"><div className="container">
        <span className="eyebrow eyebrow-light">SIKÇA SORULAN SORULAR</span>
        <h1>Aklınıza takılanları açıkça yanıtlıyoruz</h1>
        <p>Araç alırken veya satarken en çok sorulan soruları derledik. Aradığınızı bulamazsanız bize doğrudan ulaşın.</p>
      </div></section>
      <section className="listing-section"><div className="container page-narrow">
        <div className="faq-list">
          {faqItems.map((item) => <details className="faq-item" key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </div>
        <p style={{ marginTop: 28 }}><Link className="text-link" href="/iletisim">Hâlâ sorunuz mu var? Bize yazın <ArrowRight size={14} /></Link></p>
      </div></section>
    </>
  );
}
