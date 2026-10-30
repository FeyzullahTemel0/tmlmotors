import { parseBlogContent } from "@/lib/blog-content";

export function BlogContent({ content }: { content: string }) {
  return (
    <div className="post-body">
      {parseBlogContent(content).map((block, index) => {
        switch (block.type) {
          case "heading": return block.level === 2 ? <h2 key={index}>{block.text}</h2> : <h3 key={index}>{block.text}</h3>;
          case "list": return <ul key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>;
          case "quote": return <blockquote key={index}>{block.text}</blockquote>;
          case "image": return (
            <figure key={index}>
              <img src={block.url} alt={block.caption || "Blog görseli"} loading="lazy" />
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </figure>
          );
          default: return <p key={index}>{block.text}</p>;
        }
      })}
    </div>
  );
}
