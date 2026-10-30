export type BlogBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "image"; url: string; caption: string };

const imagePattern = /^!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)$/;

// Yazı içeriği düz metindir; satır başındaki basit işaretlerle biçimlendirilir.
export function parseBlogContent(content: string): BlogBlock[] {
  const blocks: BlogBlock[] = [];
  const lines = content.replace(/\r/g, "").split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const image = imagePattern.exec(line);
    if (image) { blocks.push({ type: "image", caption: image[1].trim(), url: image[2] }); continue; }
    if (line.startsWith("### ")) { blocks.push({ type: "heading", level: 3, text: line.slice(4).trim() }); continue; }
    if (line.startsWith("## ")) { blocks.push({ type: "heading", level: 2, text: line.slice(3).trim() }); continue; }
    if (line.startsWith("> ")) { blocks.push({ type: "quote", text: line.slice(2).trim() }); continue; }
    if (/^[-•*] /.test(line)) {
      const item = line.slice(2).trim();
      const last = blocks[blocks.length - 1];
      if (last?.type === "list") last.items.push(item);
      else blocks.push({ type: "list", items: [item] });
      continue;
    }
    blocks.push({ type: "paragraph", text: line });
  }

  return blocks;
}

export function estimateReadingMinutes(content: string) {
  const words = content.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
