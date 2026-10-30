import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase-client";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  published: boolean;
  createdAt?: string;
};

function mapPost(snapshot: QueryDocumentSnapshot<DocumentData>): BlogPost {
  const data = snapshot.data();
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined;

  return {
    id: snapshot.id,
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    content: String(data.content ?? ""),
    coverImageUrl: data.coverImageUrl ? String(data.coverImageUrl) : undefined,
    published: Boolean(data.published),
    createdAt,
  };
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const db = getFirebaseDb();
  const ref = collection(db, "blogPosts");
  const q = query(ref, where("published", "==", true), limit(200));
  const snapshot = await getDocs(q);
  return sortNewestFirst(snapshot.docs.map(mapPost)).slice(0, 24);
}

function sortNewestFirst(posts: BlogPost[]): BlogPost[] {
  return posts.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getLatestPublishedBlogPost(): Promise<BlogPost | null> {
  const db = getFirebaseDb();
  const ref = collection(db, "blogPosts");
  const q = query(ref, where("published", "==", true), limit(200));
  const snapshot = await getDocs(q);
  return sortNewestFirst(snapshot.docs.map(mapPost))[0] ?? null;
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!slug) {
    throw new Error("Blog yazısı için slug gereklidir.");
  }

  const db = getFirebaseDb();
  const ref = collection(db, "blogPosts");
  const q = query(ref, where("slug", "==", slug), where("published", "==", true), limit(1));
  const snapshot = await getDocs(q);
  const first = snapshot.docs[0];
  return first ? mapPost(first) : null;
}

export async function createBlogDraft(input: {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
}) {
  if (!input.slug || !input.title || !input.excerpt || !input.content) {
    throw new Error("Blog taslağı için slug, başlık, özet ve içerik zorunludur.");
  }

  const db = getFirebaseDb();
  const slugRef = doc(db, "blogSlugs", input.slug);
  const slugSnapshot = await getDoc(slugRef);
  if (slugSnapshot.exists()) {
    throw new Error("Bu slug zaten kullanılıyor. Lütfen farklı bir slug girin.");
  }

  await addDoc(collection(db, "blogPosts"), {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    coverImageUrl: input.coverImageUrl ?? "",
    published: false,
    createdAt: serverTimestamp(),
  });

  await addDoc(collection(db, "blogSlugsAudit"), {
    slug: input.slug,
    createdAt: serverTimestamp(),
  });
}
