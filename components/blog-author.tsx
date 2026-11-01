"use client";

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { fullDate, timeAgo } from "@/lib/time-ago";
import { usePreferences } from "@/lib/i18n/preferences-context";

type AuthorInfo = { name: string; avatarUrl: string };

let cachedAuthor: AuthorInfo | null = null;

export function BlogAuthor({ dateISO, large = false }: { dateISO?: string; large?: boolean }) {
  const { language } = usePreferences();
  const [author, setAuthor] = useState<AuthorInfo | null>(cachedAuthor);

  useEffect(() => {
    if (cachedAuthor) return;
    let active = true;
    void fetch("/api/blog-author")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: AuthorInfo | null) => {
        if (active && data) {
          cachedAuthor = data;
          setAuthor(data);
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <header className={large ? "feed-author post-author" : "feed-author"}>
      <span className="feed-avatar" aria-hidden="true">
        {author?.avatarUrl ? <img className="feed-avatar-img" src={author.avatarUrl} alt="" /> : "TM"}
      </span>
      <div className="feed-author-info">
        <b>{author?.name || "TML MOTORS"} <BadgeCheck size={14} /></b>
      </div>
      {dateISO ? (
        <time dateTime={dateISO} title={fullDate(dateISO, language)}>
          {fullDate(dateISO, language)} · {timeAgo(dateISO, language)}
        </time>
      ) : null}
    </header>
  );
}
