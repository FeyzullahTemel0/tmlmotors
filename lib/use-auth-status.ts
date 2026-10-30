"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, getFirebaseConnectionStatus } from "@/lib/firebase-client";

export type AuthStatus = { ready: boolean; signedIn: boolean; isAdmin: boolean };

export async function checkIsAdmin(getToken: () => Promise<string>): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/session", {
      headers: { Authorization: `Bearer ${await getToken()}` },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function useAuthStatus(): AuthStatus {
  const [status, setStatus] = useState<AuthStatus>({ ready: false, signedIn: false, isAdmin: false });

  useEffect(() => {
    if (!getFirebaseConnectionStatus().ready) return;
    return onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        setStatus({ ready: true, signedIn: false, isAdmin: false });
        return;
      }
      setStatus({ ready: true, signedIn: true, isAdmin: false });
      const isAdmin = await checkIsAdmin(() => user.getIdToken(true));
      setStatus({ ready: true, signedIn: true, isAdmin });
    });
  }, []);

  return status;
}
