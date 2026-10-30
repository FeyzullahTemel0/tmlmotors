import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase-client";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  savedBlogSlugs: string[];
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) {
    throw new Error("Profil sorgusu için kullanıcı kimliği gereklidir.");
  }

  const db = getFirebaseDb();
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    uid,
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    avatarUrl: String(data.avatarUrl ?? ""),
    savedBlogSlugs: Array.isArray(data.savedBlogSlugs)
      ? data.savedBlogSlugs.map((value: unknown) => String(value))
      : [],
  };
}

export async function saveUserProfile(input: UserProfile): Promise<void> {
  if (!input.uid) {
    throw new Error("Profil kaydı için kullanıcı kimliği gereklidir.");
  }

  const db = getFirebaseDb();
  const ref = doc(db, "users", input.uid);
  await setDoc(ref, {
    email: input.email,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    savedBlogSlugs: input.savedBlogSlugs,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
