"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Coins, Languages, X } from "lucide-react";
import { currencyOptions, languages } from "@/lib/i18n/translations";
import { usePreferences } from "@/lib/i18n/preferences-context";

export function LanguageSwitcher() {
  const { language, setLanguage, currency, setCurrency, t } = usePreferences();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lang-switcher" ref={rootRef}>
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${t("language")} / ${t("currency")}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Languages size={15} />
        <span className="lang-trigger-code">{language.toUpperCase()}</span>
        <span className="lang-trigger-currency">{currency}</span>
      </button>
      {open ? (
        <div className="lang-pop" role="dialog" aria-label={t("language")}>
          <div className="lang-pop-head">
            <span><Languages size={13} /> {t("language")}</span>
            <button type="button" aria-label={t("close")} onClick={() => setOpen(false)}><X size={14} /></button>
          </div>
          <div className="lang-pop-list" role="listbox" aria-label={t("language")}>
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={language === item.code}
                className={language === item.code ? "lang-option is-active" : "lang-option"}
                onClick={() => setLanguage(item.code)}
              >
                <span>{item.label}</span>
                {language === item.code ? <Check size={14} /> : null}
              </button>
            ))}
          </div>
          <div className="lang-pop-head lang-pop-head-currency"><span><Coins size={13} /> {t("currency")}</span></div>
          <div className="lang-currency-row">
            {currencyOptions.map((item) => (
              <button
                key={item.code}
                type="button"
                className={currency === item.code ? "lang-currency is-active" : "lang-currency"}
                onClick={() => setCurrency(item.code)}
              >
                <b>{item.symbol}</b> {item.code}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
