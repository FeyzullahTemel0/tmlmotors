import type { MetadataRoute } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const toDate = (value: unknown, fallback: Date) => {
  const time = (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
  return time ? new Date(time) : fallback;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/araclar`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/hasarli-araclar`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/aracimi-sat`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/galericiler`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/duyurular`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/yorumlar`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/sss`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/iletisim`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/kvkk`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/cerez-politikasi`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/kullanim-kosullari`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const db = getAdminDb();
    const [vehicles, posts, dealers] = await Promise.all([
      db.collection("vehicles").where("status", "==", "published").limit(500).get(),
      db.collection("blogPosts").where("published", "==", true).limit(500).get(),
      db.collection("dealers").where("active", "==", true).limit(200).get(),
    ]);
    vehicles.docs.forEach((document) => {
      const data = document.data();
      entries.push({ url: `${siteUrl}/araclar/${document.id}`, lastModified: toDate(data.updatedAt ?? data.createdAt, now), changeFrequency: "weekly", priority: data.heavyDamage === true ? 0.5 : 0.8 });
    });
    posts.docs.forEach((document) => {
      const data = document.data();
      if (typeof data.slug === "string" && data.slug) entries.push({ url: `${siteUrl}/blog/${data.slug}`, lastModified: toDate(data.updatedAt ?? data.createdAt, now), changeFrequency: "monthly", priority: 0.6 });
    });
    dealers.docs.forEach((document) => {
      const data = document.data();
      if (typeof data.slug === "string" && data.slug && data.businessName) entries.push({ url: `${siteUrl}/galericiler/${data.slug}`, changeFrequency: "weekly", priority: 0.4 });
    });
  } catch {
    // Veritabanına ulaşılamazsa statik sayfalar yine de listelenir.
  }
  return entries;
}
