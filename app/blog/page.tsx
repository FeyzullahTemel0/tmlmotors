"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getFirebaseConnectionStatus } from "@/lib/firebase-client";
import { getPublishedBlogPosts, type BlogPost } from "@/lib/blog-service";
import { BlogEngagement } from "@/components/blog-engagement";
import { BlogAuthor } from "@/components/blog-author";
import { AdSlot } from "@/components/ad-slot";
import { plainText } from "@/lib/blog-content";
import { Loading } from "@/components/loading";
import { usePreferences } from "@/lib/i18n/preferences-context";
import { blogCategories, normalizeBlogCategory } from "@/lib/blog-categories";

function excerptOf(post: BlogPost): string {
  if (post.excerpt.trim()) return plainText(post.excerpt);
  return plainText(post.content.replace(/<[^>]+>/g, " "));
}

export default function BlogPage() {
  const firebaseStatus = useMemo(() => getFirebaseConnectionStatus(), []);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { language, t } = usePreferences();

  useEffect(() => {
    if (!firebaseStatus.ready) {
      setLoading(false);
      setErrorMessage(firebaseStatus.message);
      return;
    }

    let isMounted = true;

    async function run() {
      try {
        const result = await getPublishedBlogPosts();
        if (isMounted) {
          setPosts(result);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Blog yazıları alınamadı.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      isMounted = false;
    };
  }, [firebaseStatus.message, firebaseStatus.ready]);

  const availableCategories = blogCategories.filter((category) => posts.some((post) => normalizeBlogCategory(post.category) === category));
  const visiblePosts = activeCategory === "all" ? posts : posts.filter((post) => normalizeBlogCategory(post.category) === activeCategory);

  return (
    <>
      <section className="subpage-hero">
        <div className="container">
          <span className="eyebrow eyebrow-light">{t("navBlog").toLocaleUpperCase(language)}</span>
          <h1>{t("blogHeroTitleA")}<br />{t("blogHeroTitleB")}</h1>
          <p>{t("blogHeroText")}</p>
        </div>
      </section>

      <section className="listing-section">
        <div className="container">
          <AdSlot placement="blog-top" />
          {loading ? (
            <Loading label={t("blogLoading")} />
          ) : errorMessage ? (
            <div className="auth-notice auth-notice-error">{errorMessage}</div>
          ) : posts.length === 0 ? (
            <div className="content-coming-soon">
              <span className="eyebrow">{t("blogEmptyEyebrow")}</span>
              <h2>{t("blogEmptyTitle")}</h2>
              <p>{t("blogEmptyText")}</p>
            </div>
          ) : (
            <>
              <nav className="blog-category-filter" aria-label="Blog kategorileri">
                <button type="button" className={activeCategory === "all" ? "is-active" : ""} aria-pressed={activeCategory === "all"} onClick={() => setActiveCategory("all")}>Tüm yazılar</button>
                {availableCategories.map((category) => (
                  <button type="button" key={category} className={activeCategory === category ? "is-active" : ""} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{category}</button>
                ))}
              </nav>
              <div className="blog-list feed-list">
                {visiblePosts.map((post) => (
                  <article className="blog-card feed-card" key={post.id}>
                    <BlogAuthor dateISO={post.createdAt} />
                    {post.coverImageUrl ? <Link className="blog-card-image" href={`/blog/${post.slug}`} style={{ backgroundImage: `url("${post.coverImageUrl}")` }} aria-label={`${post.title} yazısını oku`} /> : null}
                    <div className="blog-card-content">
                      <span className="blog-category-label">{normalizeBlogCategory(post.category)}</span>
                      <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
                      <p className="feed-excerpt">{excerptOf(post)}</p>
                      <Link className="feed-more" href={`/blog/${post.slug}`}>{t("readMore")} <ArrowRight size={13} /></Link>
                      <BlogEngagement slug={post.slug} title={post.title} />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
