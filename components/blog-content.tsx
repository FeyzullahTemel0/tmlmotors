import type { ReactNode } from "react";
import { parseBlogContent, type InlineSegment } from "@/lib/blog-content";

function Inline({ segments }: { segments: InlineSegment[] }) {
  return (
    <>
      {segments.map((segment, index): ReactNode => {
        let node: ReactNode = segment.text;
        if (segment.bold) node = <strong>{node}</strong>;
        if (segment.italic) node = <em>{node}</em>;
        if (segment.href) node = <a href={segment.href} target="_blank" rel="noopener noreferrer nofollow">{node}</a>;
        return <span key={index}>{node}</span>;
      })}
    </>
  );
}

export function BlogContent({ content }: { content: string }) {
  const blocks = parseBlogContent(content);
  const leadIndex = blocks.findIndex((block) => block.type === "paragraph");

  return (
    <div className="post-body">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading": return block.level === 2 ? <h2 key={index}>{block.text}</h2> : <h3 key={index}>{block.text}</h3>;
          case "rule": return <hr key={index} className="post-rule" />;
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return <Tag key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}><Inline segments={item} /></li>)}</Tag>;
          }
          case "quote": return <blockquote key={index}><Inline segments={block.segments} /></blockquote>;
          case "image": return (
            <figure key={index}>
              <img src={block.url} alt={block.caption || "Blog görseli"} loading="lazy" />
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </figure>
          );
          default: return <p key={index} className={index === leadIndex ? "post-lead" : undefined}><Inline segments={block.segments} /></p>;
        }
      })}
    </div>
  );
}
