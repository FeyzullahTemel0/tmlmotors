import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Müşteri Yorumları",
  description: "TML MOTORS müşterilerinin araç alım satım deneyimleri ve yorumları.",
  alternates: { canonical: "/yorumlar" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
