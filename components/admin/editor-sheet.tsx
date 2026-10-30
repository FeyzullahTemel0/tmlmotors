"use client";

import { useEffect, useRef } from "react";
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

// Ekle / düzenle işlemlerini listeden bağımsız, tam ekran bir çalışma alanında açar.
// Başlık ve kaydet çubuğu her zaman ekranda kaldığı için sayfanın altına inmek gerekmez.
export function EditorSheet({ title, subtitle, onClose, primaryAction, error, success, children }: EditorSheetProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  function requestClose() {
    if (window.confirm("Kaydedilmemiş değişiklikler kaybolacak. Çıkmak istiyor musunuz?")) onClose();
  }

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    if (error) bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [error]);

  return (
    <div className="adm-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <header className="adm-sheet-head">
        <button type="button" className="adm-icon-btn" aria-label="Kapat" onClick={requestClose}><X size={18} /></button>
        <div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>
      </header>
      <div className="adm-sheet-body" ref={bodyRef}>
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
