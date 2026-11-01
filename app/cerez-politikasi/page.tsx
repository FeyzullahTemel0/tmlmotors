import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "TML MOTORS web sitesinde kullanılan çerezler ve yerel depolama hakkında bilgilendirme.",
  alternates: { canonical: "/cerez-politikasi" },
};

export default function CookiePolicyPage() {
  return (
    <LegalPage eyebrow="ÇEREZ POLİTİKASI" title="Çerezler ve yerel depolama" intro="Sitemizde reklam veya takip amaçlı çerez kullanmıyoruz. Yalnızca sitenin çalışması için gerekli olanları kullanıyoruz." updated="Kasım 2026">
      <h2>1. Hangi verileri tarayıcınızda saklıyoruz?</h2>
      <ul>
        <li><b>Oturum bilgisi:</b> giriş yaptığınızda hesabınızın açık kalması için kimlik doğrulama hizmetimiz tarayıcınızda oturum verisi tutar.</li>
        <li><b>Tercihleriniz:</b> seçtiğiniz dil ve para birimi.</li>
        <li><b>Karşılaştırma listesi:</b> karşılaştırmaya eklediğiniz ilanlar bu cihazda saklanır.</li>
        <li><b>Ziyaretçi kimliği:</b> aynı ilanın aynı kişi tarafından tekrar tekrar sayılmaması için rastgele oluşturulan anonim bir kimlik. Kişiyi tanımlamaz, başka sitelerle paylaşılmaz.</li>
        <li><b>Çerez bildirimi tercihi:</b> bu bilgilendirmeyi okuduğunuzu hatırlamak için.</li>
      </ul>
      <h2>2. Üçüncü taraf hizmetler</h2>
      <p>Haritalar, Google ile giriş ve görseller gibi özellikler ilgili hizmet sağlayıcıların sunucularından yüklenebilir. Bu hizmetler kendi gizlilik politikalarına tabidir.</p>
      <h2>3. Reklam ve takip</h2>
      <p>Bu sitede davranışsal reklam, profilleme veya üçüncü taraf takip çerezleri kullanılmaz. Site içindeki reklam alanları, işletmemizin anlaşmalı galerici ortaklarının tanıtımlarıdır.</p>
      <h2>4. Tercihlerinizi yönetme</h2>
      <p>Tarayıcı ayarlarınızdan çerezleri ve site verilerini dilediğiniz zaman silebilirsiniz. Zorunlu verileri sildiğinizde oturumunuz kapanır ve tercihleriniz sıfırlanır.</p>
      <h2>5. İletişim</h2>
      <p>Sorularınız için +90 553 578 11 36 numarasından bize ulaşabilirsiniz. Ayrıntılar için <a href="/kvkk">KVKK Aydınlatma Metni</a>&apos;ni inceleyin.</p>
    </LegalPage>
  );
}
