"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

type EditorSheetProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  primaryAction: React.ReactNode;
  error?: string;
  success?: string;
  children: React.ReactNode;
};

type SheetSection = { index: number; title: string };

// Ekle / düzenle işlemlerini listeden bağımsız, tam ekran bir çalışma alanında açar.
// Yükseklik tarayıcının gerçek görünür alanına bağlanır; adres çubuğu ve klavye açılsa da
// kaydet çubuğu ekranda kalır. Kaydet düğmesi ayrıca üst çubukta da bulunur.
export function EditorSheet({ title, subtitle, onClose, primaryAction, error, success, children }: EditorSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const touchedRef = useRef(false);
  const [sections, setSections] = useState<SheetSection[]>([]);
  const [active, setActive] = useState(0);

  function requestClose() {
    if (!touchedRef.current || window.confirm("Kaydedilmemiş değişiklikler kaybolacak. Çıkmak istiyor musunuz?")) onClose();
  }

  const cards = useCallback(() => Array.from(bodyRef.current?.querySelectorAll<HTMLElement>("section.adm-card") ?? []).filter((card) => card.querySelector(".adm-card-head h2")), []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const sheet = sheetRef.current;
    const viewport = window.visualViewport;
    if (!sheet) return;

    function sync() {
      if (!sheet) return;
      sheet.style.height = `${viewport?.height ?? window.innerHeight}px`;
      sheet.style.top = `${viewport?.offsetTop ?? 0}px`;
    }

    sync();
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  useEffect(() => {
    if (error) bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [error]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSections(cards().map((card, index) => ({ index, title: card.querySelector(".adm-card-head h2")?.textContent?.trim() ?? "" })).filter((item) => item.title));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [cards]);

  function handleScroll() {
    const body = bodyRef.current;
    if (!body) return;
    const limit = body.getBoundingClientRect().top + 72;
    let current = 0;
    cards().forEach((card, index) => { if (card.getBoundingClientRect().top <= limit) current = index; });
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 4) current = Math.max(0, cards().length - 1);
    setActive((previous) => {
      if (previous !== current) navRef.current?.querySelectorAll<HTMLElement>("button")[current]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      return current;
    });
  }

  function jumpTo(index: number) {
    const body = bodyRef.current;
    const card = cards()[index];
    if (!body || !card) return;
    const top = card.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 10;
    body.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <div className="adm-sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-label={title}>
      <header className="adm-sheet-head">
        <button type="button" className="adm-icon-btn" aria-label="Kapat" onClick={requestClose}><X size={18} /></button>
        <div className="adm-sheet-title"><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>
        <div className="adm-sheet-head-action">{primaryAction}</div>
      </header>
      {sections.length > 2 ? (
        <nav className="adm-sheet-nav" ref={navRef} aria-label="Form bölümleri">
          {sections.map((section) => (
            <button type="button" key={section.index} className={active === section.index ? "is-active" : undefined} aria-current={active === section.index ? "true" : undefined} onClick={() => jumpTo(section.index)}>
              <i>{section.index + 1}</i>{section.title}
            </button>
          ))}
        </nav>
      ) : null}
      <div
        className="adm-sheet-body"
        ref={bodyRef}
        onScroll={handleScroll}
        onInputCapture={() => { touchedRef.current = true; }}
        onChangeCapture={() => { touchedRef.current = true; }}
        onClickCapture={(event) => { if ((event.target as HTMLElement).closest("button, label, [role='button']")) touchedRef.current = true; }}
      >
        <div className="adm-sheet-inner">
          {error ? <div className="adm-alert is-error" role="alert">{error}</div> : null}
          {success ? <div className="adm-alert is-success" role="status"><Check size={16} /> {success}</div> : null}
          {children}
        </div>
      </div>
      <footer className="adm-sheet-foot"><div className="adm-sheet-inner adm-sheet-actions">{primaryAction}<button type="button" className="adm-btn ghost" onClick={requestClose}>Vazgeç</button></div></footer>
    </div>
  );
}
