# TML MOTORS

TML MOTORS için Next.js App Router uygulaması. İşletme Gaziantep Günsev Oto AVM'de faaliyet gösterir; araç alım ve satım danışmanlığı sunar. Üretim hedefi Vercel, veritabanı Firebase/Firestore, görsel depolama Cloudinary'dir.

## Yerel geliştirme ve kontroller

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Uygulama kapsamı

- Lüks marka dili ve responsive ana sayfa; araç alım/satım hizmetleri, yayınlı envanter, sponsor alanı ve en son blog yazısı.
- `/araclar` ve `/araclar/[slug]`: Firestore üzerinden yönetilen, gerçek araç ilanları.
- Ana sayfadaki envanter şeridi en yeni ilanı başta gösterir; dokunmatik kaydırma, masaüstü okları ve fareyle sürükleme desteklenir. İlan detayında fotoğraf galerisi, teknik bilgiler ve satıcı iletişim alanı bulunur.
- Admin araç formunda marka → model → seri → paket → alt paket kataloğu yönetilebilir; eksik seçenekler yönetici tarafından eklenir. Araçların boya/değişen parça beyanı etkileşimli araç şemasından kaydedilip ilan detayında gösterilir.
- `/admin`: yalnızca `ADMIN_EMAILS` allowlist'indeki doğrulanmış Firebase hesabına açık; araç ekleme/düzenleme/yayınlama/satış durumu, blog yönetimi, sponsor alanları ve sosyal bağlantılar.
- TML MOTORS tarafından yayımlanan blog paylaşımlarında üyeler beğeni ve kaydetme yapabilir; paylaşım bağlantısını paylaşabilir.
- Beğeni/kaydetme sayıları herkese açık; etkileşimde bulunan üye bilgileri ve okunmamış bildirimler yalnızca yönetici panelinde görünür. Bildirimler panel açıkken 30 saniyede bir yenilenir.
- `/giris` ve `/profil`: Firebase Authentication, e-posta doğrulaması, kullanıcı profili, Cloudinary profil fotoğrafı ve kaydedilen blog yazıları.
- Cloudinary doğrudan yükleme için sunucuda imza oluşturur; API anahtarı dışında gizli değerler hiçbir zaman tarayıcıya verilmez.
- `robots.txt` ve `sitemap.xml` üretimi; `NEXT_PUBLIC_SITE_URL` tanımlandığında tam site adresi.

## Firebase kurulumu

1. Firebase Authentication'da e-posta/şifre sağlayıcısını etkinleştirin.
2. İşletme yöneticisinin hesabını Firebase Authentication'da oluşturun, doğrulayın ve adresini `ADMIN_EMAILS` değişkenine ekleyin. Bu adres virgülle ayrılmış bir allowlist değeridir.
3. Firestore veritabanını oluşturup `firestore.rules` içeriğini deploy edin. Yönetim API'leri Admin SDK kullanır ve tüm yazma işlemlerinde Firebase ID token ile doğrulanmış allowlist kontrolü yapar.
4. Firebase Admin service account JSON'ını `FIREBASE_SERVICE_ACCOUNT_JSON` olarak Vercel'de **server-only** bir değişkene ekleyin. JSON'u kaynak koda veya `NEXT_PUBLIC_` değişkenine koymayın.

## Cloudinary kurulumu

Cloudinary hesap bilgilerindeki cloud name ve API key'i `NEXT_PUBLIC_` değişkenlerine girin; API secret yalnızca `CLOUDINARY_API_SECRET` server değişkeninde tutulmalıdır. Görseller imzalı yükleme API'si üzerinden `tml-motors/` klasörlerine kaydedilir.

## Gerekli ortam değişkenleri

Değerleri dağıtım öncesinde `.env.example` dosyasına göre tamamlayın. `.env.example` gerçek anahtar içermez.

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
- `ADMIN_EMAILS`, `FIREBASE_SERVICE_ACCOUNT_JSON`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Firestore koleksiyonları

- `vehicles/{id}`: araç ilanları; durumlar `draft`, `published`, `sold`.
- `blogPosts/{id}`: taslak ve yayınlı blog yazıları.
- `postLikes/{postId_uid}` ve `postSaves/{postId_uid}`: tekil üye etkileşimleri. İstemci Firestore erişimi kapalıdır; doğrulanmış API işlemleri kullanılır.
- `adminNotifications/{id}`: beğeni ve kaydetme olayları; yalnızca Admin SDK ile okunup güncellenir.
- `ads/{id}`: admin tarafından yönetilen sponsor alanları.
- `siteSettings/links`: Instagram, Facebook, YouTube, sahibinden.com ve arabam.com bağlantıları.
- `siteSettings/vehicleCatalog`: admin tarafından yönetilen marka/model/seri/paket kataloğu. Başlangıçta marka listesi hazır gelir; model, seri ve paketler yönetici tarafından eklenir.
- `users/{uid}`: profil, avatar URL'si ve kayıtlı blog slug'ları; kullanıcı yalnızca kendi kaydını güncelleyebilir.

Araç şemasındaki boya/değişen bilgileri işletme beyanı olarak gösterilir ve ekspertiz raporu yerine geçmez.

## Canlıya alma

Önce Firebase Authentication, Firestore, Security Rules ve Cloudinary'yi yapılandırın; ardından aynı ortam değişkenlerini Vercel project settings içine ekleyip deploy edin. Admin oturumu için allowlist adresiyle oturum açıp e-posta doğrulamasını tamamlayın. Firebase/Cloudinary sırları eklenmeden önce yönetim, kullanıcı profili ve görsel yükleme özellikleri çalışmaz.
