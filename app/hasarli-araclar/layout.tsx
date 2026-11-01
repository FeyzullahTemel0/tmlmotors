import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ağır Hasarlı Araç Alım Satım",
  description: "Hasar bilgisi açıkça paylaşılan ağır hasarlı araç ilanları. TML MOTORS Gaziantep.",
  alternates: { canonical: "/hasarli-araclar" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
