export const featureGroupKeys = ["security", "interior", "exterior", "multimedia"] as const;
export type FeatureGroupKey = (typeof featureGroupKeys)[number];

export const featureGroupLabels: Record<FeatureGroupKey, string> = {
  security: "Güvenlik",
  interior: "İç Donanım",
  exterior: "Dış Donanım",
  multimedia: "Multimedya",
};

export const featureCatalog: Record<FeatureGroupKey, string[]> = {
  security: [
    "ABS", "AEB", "ASR", "BAS", "Distronic", "ESP / VSA", "Gece Görüş Sistemi",
    "Hava Yastığı (Sürücü)", "Hava Yastığı (Yolcu)", "Yan Hava Yastıkları", "Perde Hava Yastıkları",
    "İmmobilizer", "Isofix", "Kör Nokta Uyarı Sistemi", "Merkezi Kilit", "Şerit Takip Asistanı",
    "Yokuş Kalkış Desteği", "Yorgunluk Tespit Sistemi", "Çocuk Kilidi", "Zırhlı Araç",
  ],
  interior: [
    "Adaptif Hız Sabitleyici", "Anahtarsız Giriş ve Çalıştırma", "Deri Koltuk", "Elektrikli Camlar",
    "Elektrikli Koltuklar", "Fonksiyonel Direksiyon", "Geri Görüş Kamerası", "Hafızalı Koltuklar",
    "Head-up Display", "Hidrolik Direksiyon", "Hız Sabitleyici", "Isıtmalı Direksiyon",
    "Isıtmalı Koltuklar", "Klima", "Kumaş Koltuk", "Otm. Kararan Dikiz Aynası", "Ön Görüş Kamerası",
    "Ön Koltuk Kol Dayaması", "Soğutmalı Koltuklar", "Soğutmalı Torpido", "Start / Stop",
    "Üçüncü Sıra Koltuk", "Yol Bilgisayarı",
  ],
  exterior: [
    "Akıllı Bagaj Kapağı", "Alaşım Jant", "Aynalar (Elektrikli)", "Aynalar (Hafızalı)",
    "Aynalar (Isıtmalı)", "Far (Adaptif)", "Far (Bi-Xenon)", "Far (LED)", "Far Sensörü",
    "Hardtop", "Panoramik Cam Tavan", "Park Sensörü (Arka)", "Park Sensörü (Ön)",
    "Sis Farı", "Sunroof", "Yağmur Sensörü",
  ],
  multimedia: [
    "Android Auto", "Apple CarPlay", "Bluetooth", "Dokunmatik Ekran", "Navigasyon Sistemi",
    "Premium Ses Sistemi", "Radyo / CD Çalar", "USB / AUX Girişi",
  ],
};

export const tirePositionKeys = ["frontLeft", "frontRight", "rearLeft", "rearRight"] as const;
export type TirePositionKey = (typeof tirePositionKeys)[number];

export const tirePositionLabels: Record<TirePositionKey, string> = {
  frontLeft: "Ön sol lastik",
  frontRight: "Ön sağ lastik",
  rearLeft: "Arka sol lastik",
  rearRight: "Arka sağ lastik",
};

export const tireSizeSuggestions = [
  "175/65 R14", "185/65 R15", "195/55 R16", "205/55 R16", "205/60 R16",
  "215/55 R17", "225/45 R17", "225/40 R18", "245/45 R18", "255/35 R19",
];

export const tireStatusSuggestions = [
  "Sıfır takıldı", "6 ay önce takıldı", "1 yıl önce takıldı", "2 yıldan eski",
  "Değişmesi önerilir", "Kış lastiği takılı",
];
