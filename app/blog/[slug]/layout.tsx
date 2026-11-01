import type { Metadata } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { JsonLd } from "@/components/json-ld";
import { getSiteUrl } from "@/lib/site-url";

const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

async function loadPost(slug: string) {
  try {
    const snapshot = await getAdminDb().collection("blogPosts").where("slug", "==", slug).limit(1).get();
    const data = snapshot.docs[0]?.data();
    if (!data || data.published !== true) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "Rehber", robots: { index: false } };
  const title = String(post.title ?? "");
  const description = String(post.excerpt ?? "").slice(0, 160);
  const cover = typeof post.coverImageUrl === "string" && post.coverImageUrl ? [post.coverImageUrl] : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { title, description, type: "article", images: cover },
  };
}

export default async function BlogPostLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  return (
    <>
      {post ? (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: String(post.title ?? ""),
          description: String(post.excerpt ?? ""),
          mainEntityOfPage: `${getSiteUrl()}/blog/${slug}`,
          ...(post.coverImageUrl ? { image: [String(post.coverImageUrl)] } : {}),
          ...(millis(post.createdAt) ? { datePublished: new Date(millis(post.createdAt)).toISOString() } : {}),
          ...(millis(post.updatedAt) ? { dateModified: new Date(millis(post.updatedAt)).toISOString() } : {}),
          author: { "@type": "Organization", name: "TML MOTORS" },
          publisher: { "@type": "Organization", name: "TML MOTORS" },
        }} />
      ) : null}
      {children}
    </>
  );
}
