export type AdShape = "wide" | "strip" | "tall";
export type AdPage = "home" | "listing" | "vehicle" | "blog" | "article" | "all";
export type AdPosition = "top" | "middle" | "side" | "bottom";

export type AdPlacement = {
  id: string;
  label: string;
  page: AdPage;
  pageLabel: string;
  position: AdPosition;
  shape: AdShape;
  width: number;
  height: number;
  description: string;
};

export const adPlacements: AdPlacement[] = [
  { id: "home-top", label: "Ana sayfa · Üst banner", page: "home", pageLabel: "Ana sayfa", position: "top", shape: "wide", width: 1200, height: 120, description: "Ana sayfada karşılama alanı ve işletme bilgilerinin hemen altında, son blog yazısının üstünde yatay banner." },
  { id: "home-middle", label: "Ana sayfa · Orta banner", page: "home", pageLabel: "Ana sayfa", position: "middle", shape: "wide", width: 1200, height: 120, description: "Hizmetler bölümünden sonra, yaklaşım bölümünden önce yatay banner." },
  { id: "home-bottom", label: "Ana sayfa · Alt banner", page: "home", pageLabel: "Ana sayfa", position: "bottom", shape: "strip", width: 1200, height: 80, description: "Ana sayfanın sonunda, yaklaşım bölümünden sonra ve iletişim bandının hemen üstünde ince şerit." },
  { id: "listing-top", label: "Araçlar · Liste üstü", page: "listing", pageLabel: "Araç listesi", position: "top", shape: "strip", width: 1200, height: 80, description: "Tüm ilanların listelendiği sayfada filtrelerin üstünde ince şerit." },
  { id: "listing-side", label: "Araçlar · Dikey kenar", page: "listing", pageLabel: "Araç listesi", position: "side", shape: "tall", width: 240, height: 480, description: "Araç listesinin yanında sabit kalan dikey banner (yalnızca geniş ekranlarda görünür)." },
  { id: "vehicle-side", label: "İlan detayı · Yan alan", page: "vehicle", pageLabel: "İlan detayı", position: "side", shape: "tall", width: 240, height: 480, description: "Araç ilan sayfasında fiyat ve satıcı bilgisinin altında dikey banner." },
  { id: "vehicle-bottom", label: "İlan detayı · Alt şerit", page: "vehicle", pageLabel: "İlan detayı", position: "bottom", shape: "strip", width: 1200, height: 80, description: "Araç ilan bilgilerinin altında ince yatay şerit." },
  { id: "blog-top", label: "Blog · Liste üstü", page: "blog", pageLabel: "Blog listesi", position: "top", shape: "strip", width: 1200, height: 80, description: "Blog yazılarının üstünde ince yatay şerit." },
  { id: "article-side", label: "Yazı detayı · Dikey kenar", page: "article", pageLabel: "Blog yazısı", position: "side", shape: "tall", width: 240, height: 480, description: "Blog yazısı okunurken yanında duran dikey banner (yalnızca geniş ekranlarda görünür)." },
  { id: "article-bottom", label: "Yazı detayı · Yazı sonu", page: "article", pageLabel: "Blog yazısı", position: "bottom", shape: "strip", width: 1200, height: 80, description: "Blog yazısı bittiğinde, diğer yazılardan önce ince yatay şerit. Telefonda yan alan olmadığı için en görünür konumdur." },
  { id: "footer-strip", label: "Tüm sayfalar · Alt şerit", page: "all", pageLabel: "Tüm sayfalar", position: "bottom", shape: "strip", width: 1200, height: 80, description: "Sitenin her sayfasında alt bilgi alanının hemen üstünde ince şerit." },
];
export const adPlacementIds = adPlacements.map((placement) => placement.id);
export const legacyAdPlacements = ["home-middle"];

export function getAdPlacement(id: string): AdPlacement | undefined {
  return adPlacements.find((placement) => placement.id === id);
}

export type PublicAd = {
  id: string;
  business: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  placements: string[];
  priority: number;
};
