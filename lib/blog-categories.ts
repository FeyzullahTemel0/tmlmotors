export const blogCategories = [
  "Araç İncelemeleri",
  "Satın Alma Rehberi",
  "Bakım ve Teknik",
  "Sektör Haberleri",
  "TML MOTORS'tan",
  "Genel",
] as const;

export type BlogCategory = (typeof blogCategories)[number];

export function normalizeBlogCategory(value: unknown): BlogCategory {
  return typeof value === "string" && blogCategories.includes(value as BlogCategory) ? value as BlogCategory : "Genel";
}
