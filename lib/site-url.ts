// Canlıda alan adı değişse de sitemap, robots ve paylaşım bağlantıları doğru kalsın diye adres sırayla çözülür:
// 1) NEXT_PUBLIC_SITE_URL  2) Vercel'in ürettiği production alan adı  3) geliştirme ortamı
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
