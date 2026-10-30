"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type CurrencyCode, type TranslationKey } from "@/lib/i18n/translations";

export const currencyCookie = "tml_currency";
export const languageCookie = "tml_lang";
const languageStorage = "tml-language";
const currencyStorage = "tml-currency";

type Rates = Record<string, number>;

type PreferencesContextValue = {
  language: string;
  setLanguage: (code: string) => void;
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  rates: Rates;
  formatPrice: (tryAmount: number | null) => string;
  t: (key: TranslationKey) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>("tr");
  const [currency, setCurrencyState] = useState<CurrencyCode>("TRY");
  const [rates, setRates] = useState<Rates>({ TRY: 1 });

  useEffect(() => {
    const storedLang = window.localStorage.getItem(languageStorage);
    const storedCurrency = window.localStorage.getItem(currencyStorage) as CurrencyCode | null;
    if (storedLang) setLanguageState(storedLang);
    if (storedCurrency && ["TRY", "USD", "EUR", "GBP"].includes(storedCurrency)) setCurrencyState(storedCurrency);

    void fetch("/api/fx", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { rates?: Rates };
        if (response.ok && result.rates) setRates(result.rates);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo<PreferencesContextValue>(() => ({
    language,
    setLanguage(code) {
      setLanguageState(code);
      window.localStorage.setItem(languageStorage, code);
      setCookie(languageCookie, code);
    },
    currency,
    setCurrency(code) {
      setCurrencyState(code);
      window.localStorage.setItem(currencyStorage, code);
      setCookie(currencyCookie, code);
    },
    rates,
    formatPrice(tryAmount) {
      if (tryAmount === null) return translate(language, "priceOnCall");
      if (currency === "TRY") {
        return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(tryAmount);
      }
      const rate = rates[currency];
      if (!rate) {
        return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(tryAmount);
      }
      const locale = language === "tr" ? "tr-TR" : language === "ar" ? "ar" : language === "ru" ? "ru-RU" : language === "de" ? "de-DE" : language === "fr" ? "fr-FR" : "en-US";
      return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(tryAmount * rate);
    },
    t(key) {
      return translate(language, key);
    },
  }), [language, currency, rates]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences, PreferencesProvider içinde kullanılmalıdır.");
  return context;
}
