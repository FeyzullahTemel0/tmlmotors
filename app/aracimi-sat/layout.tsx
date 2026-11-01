import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aracımı Sat | Ücretsiz Araç Değerleme",
  description: "Gaziantep'te aracınızı güvenle satın. TML MOTORS ücretsiz değerleme yapar, süreci sizin yerinize yönetir. Hiçbir aşamada ödeme istenmez.",
  alternates: { canonical: "/aracimi-sat" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
