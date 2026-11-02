import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "TML MOTORS kişisel verilerin korunması ve işlenmesi hakkında aydınlatma metni.",
  alternates: { canonical: "/kvkk" },
};

export default function KvkkPage() {
  return (
    <LegalPage eyebrow="KVKK" title="Kişisel Verilerin Korunması Aydınlatma Metni" intro="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında verilerinizin nasıl işlendiğini şeffaf biçimde açıklıyoruz." updated="Kasım 2026">
      <h2>1. Veri sorumlusu</h2>
      <p>Kişisel verileriniz, veri sorumlusu sıfatıyla TML MOTORS (işletme sahibi: Muhammed Emin TEMEL, Yetki Belge No: 2701072) tarafından işlenmektedir. Adres: Karacaahmet Mah. 38087 Nolu Cd. Günsev Oto AVM No:5 İç Kapı No:139, 27000 Şehitkamil / Gaziantep. Telefon: +90 553 578 11 36.</p>
      <h2>2. İşlenen kişisel veriler</h2>
      <ul>
        <li><b>Kimlik ve iletişim:</b> ad soyad, telefon numarası, e-posta adresi, şehir.</li>
        <li><b>Hesap bilgileri:</b> üyelik oluşturduğunuzda e-posta, görünen ad, profil fotoğrafı, kaydettiğiniz yazılar ve favori ilanlar.</li>
        <li><b>Araç bilgileri:</b> &quot;Aracımı Sat&quot; formunda paylaştığınız marka, model, yıl, kilometre, hasar durumu ve not alanı.</li>
        <li><b>Kullanım bilgileri:</b> ilan görüntüleme kayıtları, şikayet ve iletişim mesajlarınız.</li>
      </ul>
      <h2>3. İşleme amaçları</h2>
      <ul>
        <li>Araç değerleme taleplerinize ve iletişim mesajlarınıza geri dönüş yapmak,</li>
        <li>Üyelik, favori ilan ve kayıtlı yazı özelliklerini sunmak,</li>
        <li>İlan ve içerik kalitesini iyileştirmek, kötüye kullanımı ve güvenlik risklerini önlemek,</li>
        <li>Yasal yükümlülüklerimizi yerine getirmek.</li>
      </ul>
      <h2>4. Hukuki sebepler</h2>
      <p>Verileriniz KVKK madde 5/2 uyarınca bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması, hukuki yükümlülüğün yerine getirilmesi, meşru menfaatlerimiz ve açık rızanız hukuki sebeplerine dayanılarak işlenir.</p>
      <h2>5. Aktarım</h2>
      <p>Verileriniz satılmaz ve reklam amacıyla üçüncü kişilerle paylaşılmaz. Hizmetin sunulması için yalnızca altyapı sağlayıcılarımızla (barındırma, kimlik doğrulama, veritabanı ve görsel depolama hizmetleri) ve yasal zorunluluk halinde yetkili kurumlarla paylaşılabilir. Bu sağlayıcıların bir kısmı yurt dışında yer alabilir.</p>
      <h2>6. Saklama süresi</h2>
      <p>Verileriniz işleme amacının gerektirdiği süre boyunca ve yasal saklama sürelerince tutulur. Üyeliğinizi sildirmeniz halinde hesabınıza bağlı veriler makul sürede silinir veya anonim hale getirilir.</p>
      <h2>7. Haklarınız</h2>
      <p>KVKK madde 11 kapsamında verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, işlemeye itiraz etme ve zarar halinde tazminat talep etme haklarına sahipsiniz. Taleplerinizi +90 553 578 11 36 numarasından veya Günsev Oto AVM adresimize başvurarak iletebilirsiniz.</p>
      <h2>8. Güvenlik</h2>
      <p>Verileriniz şifreli bağlantı (HTTPS) üzerinden iletilir; yönetim alanına yalnızca yetkili kişi erişebilir. Güvenliğiniz için hesabınızın şifresini kimseyle paylaşmayın.</p>
    </LegalPage>
  );
}
