"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Bell } from "lucide-react";
import { getFirebaseAuth, getFirebaseConnectionStatus } from "@/lib/firebase-client";

export function NotificationBell() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!getFirebaseConnectionStatus().ready) return;
    return onAuthStateChanged(getFirebaseAuth(), setUser);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnread(0);
      return;
    }
    try {
      const response = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
      if (response.ok) setUnread(Number((await response.json() as { unread?: number }).unread ?? 0));
    } catch {
      // Rozet güncellenemezse sessizce önceki değerde kalır.
    }
  }, [user]);

  useEffect(() => {
    // Bildirim ekranındayken sayaç sıfırdır; çağrı yapmaya gerek yok.
    if (pathname === "/bildirimler") setUnread(0);
    else void refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    const clear = () => setUnread(0);
    window.addEventListener("tml-notifications-read", clear);
    return () => window.removeEventListener("tml-notifications-read", clear);
  }, []);

  if (!user) return null;
  return (
    <Link href="/bildirimler" className="nav-bell" aria-label={unread ? `Bildirimler, ${unread} yeni` : "Bildirimler"}>
      <Bell size={20} />
      {unread ? <span className="nav-bell-badge">{unread > 9 ? "9+" : unread}</span> : null}
    </Link>
  );
}
