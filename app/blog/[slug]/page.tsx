"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { getFirebaseConnectionStatus } from "@/lib/firebase-client";
import { getPublishedBlogPosts, getPublishedBlogPostBySlug, type BlogPost } from "@/lib/blog-service";
import { plainText } from "@/lib/blog-content";
import { BlogContent } from "@/components/blog-content";
import { BlogEngagement } from "@/components/blog-engagement";
import { BlogAuthor } from "@/components/blog-author";
import { AdSlot } from "@/components/ad-slot";
import { timeAgo } from "@/lib/time-ago";
import { usePreferences } from "@/lib/i18n/preferences-context";

export default function BlogArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const firebaseStatus = useMemo(() => getFirebaseConnectionStatus(), []);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setErrorMessage(t("postInvalid"));
      return;
    }

    if (!firebaseStatus.ready) {
      setLoading(false);
      setErrorMessage(firebaseStatus.message);
      return;
    }

    let isMounted = true;

    async function run() {
      try {
        const result = await getPublishedBlogPostBySlug(slug);
        if (!isMounted) {
          return;
        }

        if (!result) {
          setErrorMessage(t("postNotFound"));
          return;
        }

        setPost(result);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : t("postLoadFail"));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseStatus.message, firebaseStatus.ready, slug]);

  const [others, setOthers] = useState<BlogPost[]>([]);
  const [progress, setProgress] = useState(0);
  const { language, t } = usePreferences();

  useEffect(() => {
    if (!post || !firebaseStatus.ready) return;
    let active = true;
    void getPublishedBlogPosts().then((all) => {
      if (active) setOthers(all.filter((item) => item.slug !== post.slug).slice(0, 3));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [post, firebaseStatus.ready]);

  useEffect(() => {
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <article className="article-section">
      <div className="post-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <div className="container article-grid">
      <div className="post">
        <Link href="/blog" className="post-back"><ArrowLeft size={16} /> {t("backToBlog")}</Link>

        {loading ? (
          <div className="post-skeleton" aria-busy="true"><span /><span /><span /></div>
        ) : errorMessage ? (
          <div className="auth-notice auth-notice-error">{errorMessage}</div>
        ) : post ? (
          <>
            <header className="post-header">
              <span className="post-kicker">{t("navBlog").toLocaleUpperCase(language)}</span>
              {post.category ? <span className="post-category">{post.category}</span> : null}
              <BlogAuthor dateISO={post.createdAt} large />
              <h1>{post.title}</h1>
              <p className="post-intro">{plainText(post.excerpt)}</p>
            </header>
            {post.coverImageUrl ? <img className="post-cover" src={post.coverImageUrl} alt={post.title} /> : null}
            <BlogContent content={post.content} />
            <BlogEngagement slug={post.slug} title={post.title} />

            <aside className="post-cta">
              <div>
                <b>{t("postCtaTitle")}</b>
                <p>{t("postCtaText")}</p>
              </div>
              <a className="button button-primary" href="tel:+905535781136"><Phone size={16} /> +90 553 578 11 36</a>
            </aside>

            <div className="ad-inline"><AdSlot placement="article-bottom" /></div>

            {others.length ? (
              <section className="post-more">
                <h2>{t("otherPosts")}</h2>
                <div>
                  {others.map((item) => (
                    <Link key={item.id} href={`/blog/${item.slug}`}>
                      {item.coverImageUrl ? <img src={item.coverImageUrl} alt="" loading="lazy" /> : <span className="post-more-fallback" />}
                      <b>{item.title}</b>
                      {item.createdAt ? <small>{timeAgo(item.createdAt, language)}</small> : null}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
      <div className="article-aside"><AdSlot placement="article-side" /></div>
      </div>
    </article>
  );
}