"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays } from "lucide-react";
import { getLatestPublishedBlogPost, type BlogPost } from "@/lib/blog-service";
import { plainText } from "@/lib/blog-content";
import { fullDate, timeAgo } from "@/lib/time-ago";
import { usePreferences } from "@/lib/i18n/preferences-context";

export function LatestJournal() {
  const [post, setPost] = useState<BlogPost | null>(null);
  const { language, t } = usePreferences();

  useEffect(() => {
    let mounted = true;
    // Blog alanı yüklenemezse ana sayfa bozulmasın diye bölüm sessizce gizlenir.
    void getLatestPublishedBlogPost()
      .then((latest) => { if (mounted) setPost(latest); })
      .catch((reason: unknown) => console.error("Son blog yazısı yüklenemedi:", reason));
    return () => { mounted = false; };
  }, []);

  if (!post) return null;

  return (
    <section className="jc" aria-label="Son blog yazısı">
      <div className="container">
        <div className="jc-head">
          <span className="jc-eyebrow"><BookOpen size={14} /> {t("blog").toLocaleUpperCase(language)}</span>
          <Link href="/blog" className="jc-all">{t("allPosts")} <ArrowRight size={14} /></Link>
        </div>
        <Link className="jc-card" href={`/blog/${post.slug}`}>
          <span className={post.coverImageUrl ? "jc-media has-image" : "jc-media"} style={post.coverImageUrl ? { backgroundImage: `url("${post.coverImageUrl}")` } : undefined}>
            {post.coverImageUrl ? null : <BookOpen size={28} strokeWidth={1.4} />}
          </span>
          <span className="jc-body">
            <span className="jc-meta">
              <span className="jc-badge">{t("latestPost")}</span>
              {post.createdAt ? <span title={fullDate(post.createdAt, language)}><CalendarDays size={13} /> {fullDate(post.createdAt, language)} · {timeAgo(post.createdAt, language)}</span> : null}
            </span>
            <b className="jc-title">{post.title}</b>
            <span className="jc-excerpt">{plainText(post.excerpt)}</span>
            <span className="jc-cta">{t("readFull")} <ArrowUpRight size={15} /></span>
          </span>
        </Link>
      </div>
    </section>
  );
}
