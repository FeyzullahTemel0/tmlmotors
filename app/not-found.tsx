import Link from "next/link";
import { ArrowRight, Car, FileText, Phone } from "lucide-react";

export default function NotFound() {
  return (
    <section className="state-page">
      <div className="container state-page-inner">
        <span className="state-code">404</span>
        <h1>Aradığınız sayfaya ulaşamadık.</h1>
        <p>Bağlantı değişmiş ya da yayından kaldırılmış olabilir. Aşağıdaki bölümlerden devam edebilir veya doğrudan bizi arayabilirsiniz.</p>
        <div className="state-actions">
          <Link className="button button-primary" href="/">Ana sayfaya dön <ArrowRight size={16} /></Link>
          <Link className="state-link" href="/araclar"><Car size={16} /> Yayındaki araçlar</Link>
          <Link className="state-link" href="/blog"><FileText size={16} /> TML MOTORS Notları</Link>
          <a className="state-link" href="tel:+905535781136"><Phone size={16} /> +90 553 578 11 36</a>
        </div>
      </div>
    </section>
  );
}
