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

function excerptOf(post: BlogPost): string {
  if (post.excerpt.trim()) return plainText(post.excerpt);
  return plainText(post.content.replace(/<[^>]+>/g, " "));
}

export default function BlogPage() {
  const firebaseStatus = useMemo(() => getFirebaseConnectionStatus(), []);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
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

  return (
    <>
      <section className="subpage-hero">
        <div className="container">
          <span className="eyebrow eyebrow-light">{t("blog").toLocaleUpperCase(language)}</span>
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
            <div className="blog-list feed-list">
              {posts.map((post) => (
                <article className="blog-card feed-card" key={post.id}>
                  <BlogAuthor dateISO={post.createdAt} />
                  {post.coverImageUrl ? <Link className="blog-card-image" href={`/blog/${post.slug}`} style={{ backgroundImage: `url("${post.coverImageUrl}")` }} aria-label={`${post.title} yazısını oku`} /> : null}
                  <div className="blog-card-content">
                    <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
                    <p className="feed-excerpt">{excerptOf(post)}</p>
                    <Link className="feed-more" href={`/blog/${post.slug}`}>{t("readMore")} <ArrowRight size={13} /></Link>
                    <BlogEngagement slug={post.slug} title={post.title} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
