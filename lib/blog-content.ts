export type InlineSegment = { text: string; bold?: boolean; italic?: boolean; href?: string };

export type BlogBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; segments: InlineSegment[] }
  | { type: "list"; ordered: boolean; items: InlineSegment[][] }
  | { type: "quote"; segments: InlineSegment[] }
  | { type: "rule" }
  | { type: "image"; url: string; caption: string };

const imagePattern = /^!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)$/;
const rulePattern = /^(-{3,}|\*{3,}|_{3,})$/;
const bulletPattern = /^[-•*]\s+/;
const orderedPattern = /^\d{1,2}[.)]\s+/;
const inlinePattern = /(\*\*[^*]+?\*\*|__[^_]+?__|\*[^*\s](?:[^*]*?[^*\s])?\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
const emojiPattern = /(?![©®™])\p{Extended_Pictographic}\uFE0F?|[\uFE0F\u200D\u20E3]/gu;

// Yazıdaki dekoratif emojiler okuma ekranında temiz bir görünüm için kaldırılır.
export function stripEmoji(text: string) {
  return text.replace(emojiPattern, "").replace(/[ \t]{2,}/g, " ").trim();
}

function parseInline(source: string): InlineSegment[] {
  const text = stripEmoji(source);
  const segments: InlineSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(inlinePattern)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ text: text.slice(cursor, start) });

    if (token.startsWith("**") || token.startsWith("__")) segments.push({ text: token.slice(2, -2), bold: true });
    else if (token.startsWith("[")) {
      const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(token);
      segments.push(link ? { text: link[1], href: link[2] } : { text: token });
    } else segments.push({ text: token.slice(1, -1), italic: true });

    cursor = start + token.length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments.filter((segment) => segment.text.length > 0);
}

// Yazı içeriği düz metindir; satır başındaki basit işaretler ve satır içi **kalın** / *italik* ile biçimlendirilir.
export function parseBlogContent(content: string): BlogBlock[] {
  const blocks: BlogBlock[] = [];
  const lines = content.replace(/\r/g, "").split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const image = imagePattern.exec(line);
    if (image) { blocks.push({ type: "image", caption: stripEmoji(image[1]), url: image[2] }); continue; }
    if (rulePattern.test(line)) {
      if (blocks.length && blocks[blocks.length - 1].type !== "rule") blocks.push({ type: "rule" });
      continue;
    }

    const heading = /^(#{2,6})\s+(.*)$/.exec(line);
    if (heading) {
      const text = stripEmoji(heading[2].replace(/\*\*|__/g, ""));
      if (text) blocks.push({ type: "heading", level: heading[1].length <= 3 ? 2 : 3, text });
      continue;
    }

    if (line.startsWith(">")) {
      const segments = parseInline(line.replace(/^>\s*/, ""));
      if (segments.length) blocks.push({ type: "quote", segments });
      continue;
    }

    const ordered = orderedPattern.test(line);
    if (ordered || bulletPattern.test(line)) {
      const item = parseInline(line.replace(ordered ? orderedPattern : bulletPattern, ""));
      if (!item.length) continue;
      const last = blocks[blocks.length - 1];
      if (last?.type === "list" && last.ordered === ordered) last.items.push(item);
      else blocks.push({ type: "list", ordered, items: [item] });
      continue;
    }

    const segments = parseInline(line);
    if (segments.length) blocks.push({ type: "paragraph", segments });
  }

  while (blocks.length && blocks[blocks.length - 1].type === "rule") blocks.pop();
  return blocks;
}

// Kart ve özet alanları için işaretlerden arındırılmış düz metin.
export function plainText(content: string) {
  return stripEmoji(
    content
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^\s*(#{1,6}|>|[-•*]|\d{1,2}[.)])\s+/gm, "")
      .replace(/^\s*([-*_]{3,})\s*$/gm, " ")
      .replace(/(\*\*|__|\*)/g, "")
      .replace(/\s+/g, " "),
  );
}

export function estimateReadingMinutes(content: string) {
  const words = content.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
