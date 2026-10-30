const justNow: Record<string, string> = {
  tr: "az önce", en: "just now", de: "gerade eben", ar: "الآن", fr: "à l'instant", ru: "только что",
};

export function timeAgo(isoDate: string, locale = "tr"): string {
  const time = new Date(isoDate).getTime();
  if (!Number.isFinite(time)) return "";
  const seconds = Math.round((time - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 90) return justNow[locale] ?? justNow.en;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(seconds / 86400), "day");
  if (abs < 2629800) return rtf.format(Math.round(seconds / 604800), "week");
  if (abs < 31557600) return rtf.format(Math.round(seconds / 2629800), "month");
  return rtf.format(Math.round(seconds / 31557600), "year");
}

export function fullDate(isoDate: string, locale = "tr"): string {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return "";
  const intlLocale = locale === "tr" ? "tr-TR" : locale === "ar" ? "ar" : locale === "ru" ? "ru-RU" : locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US";
  return date.toLocaleDateString(intlLocale, { day: "numeric", month: "long", year: "numeric" });
}
