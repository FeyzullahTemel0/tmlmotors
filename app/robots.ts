import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/profil", "/giris", "/karsilastir", "/bildirimler"] },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
