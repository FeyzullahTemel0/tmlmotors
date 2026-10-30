"use client";

import { useRef, useState } from "react";
import { Eye, Heading2, Heading3, ImagePlus, List, PencilLine, Quote } from "lucide-react";
import { BlogContent } from "@/components/blog-content";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<string | null>;
  uploading: boolean;
};

export function BlogEditor({ value, onChange, onUpload, uploading }: Props) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  function currentLineRange(text: string, start: number, end: number) {
    const from = text.lastIndexOf("\n", start - 1) + 1;
    const nextBreak = text.indexOf("\n", end);
    return { from, to: nextBreak === -1 ? text.length : nextBreak };
  }

  function applyLinePrefix(prefix: string) {
    const area = areaRef.current;
    if (!area) return;
    const { from, to } = currentLineRange(value, area.selectionStart, area.selectionEnd);
    const stripped = value.slice(from, to).split("\n").map((line) => line.replace(/^(#{2,3} |> |[-•*] )/, ""));
    const next = stripped.map((line) => (line.trim() ? prefix + line : line)).join("\n");
    onChange(value.slice(0, from) + next + value.slice(to));
    requestAnimationFrame(() => { area.focus(); area.setSelectionRange(from + next.length, from + next.length); });
  }

  function insertBlock(block: string) {
    const area = areaRef.current;
    const position = area ? area.selectionEnd : value.length;
    const before = value.slice(0, position);
    const after = value.slice(position);
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const tail = after.startsWith("\n") ? "" : "\n";
    const next = `${before}${lead}${block}${tail}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      if (!area) return;
      const caret = (before + lead + block + tail).length;
      area.focus();
      area.setSelectionRange(caret, caret);
    });
  }

  async function addImage(file: File | undefined) {
    if (!file) return;
    const url = await onUpload(file);
    if (url) insertBlock(`![](${url})`);
  }

  return (
    <div className="adm-editor-box">
      <div className="adm-editor-toolbar" role="toolbar" aria-label="Biçimlendirme">
        <button type="button" onClick={() => applyLinePrefix("## ")} disabled={preview}><Heading2 size={18} /><span>Başlık</span></button>
        <button type="button" onClick={() => applyLinePrefix("### ")} disabled={preview}><Heading3 size={18} /><span>Alt başlık</span></button>
        <button type="button" onClick={() => applyLinePrefix("- ")} disabled={preview}><List size={18} /><span>Madde</span></button>
        <button type="button" onClick={() => applyLinePrefix("> ")} disabled={preview}><Quote size={18} /><span>Alıntı</span></button>
        <label className={uploading || preview ? "is-disabled" : undefined}>
          <ImagePlus size={18} /><span>{uploading ? "Yükleniyor" : "Fotoğraf"}</span>
          <input type="file" accept="image/*" disabled={uploading || preview} onChange={(event) => { void addImage(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        <button type="button" className={preview ? "is-on" : undefined} onClick={() => setPreview(!preview)}>
          {preview ? <PencilLine size={18} /> : <Eye size={18} />}<span>{preview ? "Yazmaya dön" : "Önizle"}</span>
        </button>
      </div>
      {preview ? (
        <div className="adm-editor-preview">{value.trim() ? <BlogContent content={value} /> : <p className="adm-hint">Önizlenecek içerik yok.</p>}</div>
      ) : (
        <textarea ref={areaRef} className="adm-editor-area" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Yazınızı buraya yazın. Her satır ayrı bir paragraf olur. Başlık, madde, alıntı ve fotoğraf için yukarıdaki düğmeleri kullanın." />
      )}
      <small className="adm-hint">{value.length.toLocaleString("tr-TR")} / 50.000 karakter · Fotoğrafı eklemek istediğiniz yere imleci koyup “Fotoğraf”a basın.</small>
    </div>
  );
}
