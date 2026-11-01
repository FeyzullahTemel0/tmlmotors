import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "TML MOTORS web sitesinin kullanım koşulları. Sitemiz hiçbir hizmet için ödeme istemez.",
  alternates: { canonical: "/kullanim-kosullari" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="KULLANIM KOŞULLARI" title="Site kullanım koşulları" intro="Siteyi kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. Kısa ve anlaşılır tuttuk." updated="Kasım 2026">
      <h2>1. Hizmetin kapsamı</h2>
      <p>TML MOTORS web sitesi; araç ilanlarını, rehber içeriklerini, araç değerleme talep formunu ve iletişim bilgilerini sunar. Site üzerinden online satış, rezervasyon veya ödeme alınmaz.</p>
      <h2>2. Ödeme politikası</h2>
      <p>Sitemiz hiçbir hizmet için ödeme istemez. Üyelik, favori ilan, karşılaştırma, değerleme ve iletişim özelliklerinin tamamı ücretsizdir. TML MOTORS adına kapora, rezervasyon veya havale isteyen kişilere itibar etmeyin; durumu bize bildirin.</p>
      <h2>3. İlan bilgileri</h2>
      <p>İlanlardaki bilgiler titizlikle hazırlanır. Fiyat, donanım ve hasar bilgisi zamanla değişebilir; kesin bilgi için aracı yerinde görmeniz ve gerekirse ekspertiz yaptırmanız önerilir. Siteden görüntülenen kur dönüşümleri bilgilendirme amaçlıdır; geçerli fiyat Türk Lirası olarak belirtilen fiyattır.</p>
      <h2>4. Üyelik ve içerik</h2>
      <ul>
        <li>Hesap bilgilerinizin doğru ve güvenliğinden siz sorumlusunuz.</li>
        <li>Yorum, şikayet ve mesajlarda hakaret, yanıltıcı veya hukuka aykırı içerik paylaşılamaz; bu içerikler yayından kaldırılabilir.</li>
        <li>Galerici profilleri yalnızca yönetici onayıyla açılır; galerici ortakların paylaştığı içeriklerden kendileri sorumludur.</li>
      </ul>
      <h2>5. Fikri mülkiyet</h2>
      <p>Sitedeki logo, tasarım, metin ve görseller TML MOTORS&apos;a aittir; izinsiz kopyalanamaz veya ticari amaçla kullanılamaz.</p>
      <h2>6. Sorumluluğun sınırı</h2>
      <p>Site kesintisiz ve hatasız çalışacak şekilde hazırlanır ancak teknik nedenlerle geçici kesintiler yaşanabilir. Dış bağlantılardaki (ör. sahibinden.com, sosyal medya) içerikler ilgili sitelerin sorumluluğundadır.</p>
      <h2>7. Değişiklikler ve uygulanacak hukuk</h2>
      <p>Koşullar güncellenebilir; güncel sürüm bu sayfada yayımlanır. Türkiye Cumhuriyeti hukuku uygulanır.</p>
      <p>Kişisel verilerinizin işlenmesi için <a href="/kvkk">KVKK Aydınlatma Metni</a> ve <a href="/cerez-politikasi">Çerez Politikası</a>&apos;nı inceleyin.</p>
    </LegalPage>
  );
}
