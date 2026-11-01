import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bildirimlerim", robots: { index: false, follow: false } };

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
