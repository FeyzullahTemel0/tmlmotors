"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth, getFirebaseConnectionStatus } from "@/lib/firebase-client";

export const MAX_COMPARE = 3;
const COMPARE_KEY = "tml-compare";

type FavoriteResult = "added" | "removed" | "login" | "error";
type CompareResult = "added" | "removed" | "full";

type CollectionsContextValue = {
  signedIn: boolean;
  favoriteIds: string[];
  compareIds: string[];
  isFavorite: (id: string) => boolean;
  isCompared: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<FavoriteResult>;
  toggleCompare: (id: string) => CompareResult;
  removeCompare: (id: string) => void;
  clearCompare: () => void;
  reloadFavorites: () => Promise<void>;
  notify: (message: string) => void;
};

const CollectionsContext = createContext<CollectionsContextValue | null>(null);

function readLocalCompare(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(COMPARE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function VehicleCollectionsProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | undefined>(undefined);
  const hydratedRef = useRef(false);
  const syncedRef = useRef(false);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    setCompareIds(readLocalCompare());
    hydratedRef.current = true;
  }, []);

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2600);
  }, []);

  const loadFromServer = useCallback(async (current: User) => {
    const response = await fetch("/api/favorites", { headers: { Authorization: `Bearer ${await current.getIdToken()}` }, cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json() as { favorites?: string[]; compare?: string[] };
    setFavoriteIds(data.favorites ?? []);
    const local = readLocalCompare();
    const merged = Array.from(new Set([...local, ...(data.compare ?? [])])).slice(0, MAX_COMPARE);
    setCompareIds(merged);
    syncedRef.current = true;
  }, []);

  useEffect(() => {
    if (!getFirebaseConnectionStatus().ready) return;
    return onAuthStateChanged(getFirebaseAuth(), (next) => {
      userRef.current = next;
      setUser(next);
      syncedRef.current = false;
      if (!next) {
        setFavoriteIds([]);
        return;
      }
      void loadFromServer(next).catch(() => undefined);
    });
  }, [loadFromServer]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(COMPARE_KEY, JSON.stringify(compareIds));
    const current = userRef.current;
    if (!current || !syncedRef.current) return;
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/favorites", {
          method: "PUT",
          headers: { Authorization: `Bearer ${await current.getIdToken()}`, "Content-Type": "application/json" },
          body: JSON.stringify({ compare: compareIds }),
        });
      } catch {
        // Karşılaştırma listesi bu cihazda kayıtlı kalır; sonraki değişiklikte yeniden denenir.
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [compareIds]);

  const toggleFavorite = useCallback(async (id: string): Promise<FavoriteResult> => {
    const current = userRef.current;
    if (!current) return "login";
    const enabled = !favoriteIds.includes(id);
    setFavoriteIds((previous) => enabled ? [...previous, id] : previous.filter((item) => item !== id));
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { Authorization: `Bearer ${await current.getIdToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: id, enabled }),
      });
      if (!response.ok) throw new Error("favorite failed");
      return enabled ? "added" : "removed";
    } catch {
      setFavoriteIds((previous) => enabled ? previous.filter((item) => item !== id) : [...previous, id]);
      return "error";
    }
  }, [favoriteIds]);

  const toggleCompare = useCallback((id: string): CompareResult => {
    if (compareIds.includes(id)) {
      setCompareIds((previous) => previous.filter((item) => item !== id));
      return "removed";
    }
    if (compareIds.length >= MAX_COMPARE) return "full";
    setCompareIds((previous) => [...previous, id]);
    return "added";
  }, [compareIds]);

  const value = useMemo<CollectionsContextValue>(() => ({
    signedIn: Boolean(user),
    favoriteIds,
    compareIds,
    isFavorite: (id) => favoriteIds.includes(id),
    isCompared: (id) => compareIds.includes(id),
    toggleFavorite,
    toggleCompare,
    removeCompare: (id) => setCompareIds((previous) => previous.filter((item) => item !== id)),
    clearCompare: () => setCompareIds([]),
    reloadFavorites: async () => { if (userRef.current) await loadFromServer(userRef.current); },
    notify,
  }), [user, favoriteIds, compareIds, toggleFavorite, toggleCompare, loadFromServer, notify]);

  return <CollectionsContext.Provider value={value}>{children}{notice ? <div className="collection-toast" role="status">{notice}</div> : null}</CollectionsContext.Provider>;
}

export function useVehicleCollections(): CollectionsContextValue {
  const context = useContext(CollectionsContext);
  if (!context) throw new Error("useVehicleCollections yalnızca VehicleCollectionsProvider içinde kullanılabilir.");
  return context;
}
