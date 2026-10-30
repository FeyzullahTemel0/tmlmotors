import { NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { apiError, getAdminDb, requireAdmin } from "@/lib/firebase-admin";

type InteractionUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
};

function mapInteraction(document: QueryDocumentSnapshot): InteractionUser {
  const data = document.data();
  return {
    id: document.id,
    name: String(data.userName ?? "TML MOTORS üyesi"),
    email: String(data.userEmail ?? ""),
    createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
  };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const db = getAdminDb();
    const post = await db.collection("blogPosts").doc(id).get();
    if (!post.exists) return NextResponse.json({ error: "Blog yazısı bulunamadı." }, { status: 404 });

    const [likes, saves, likeCount, saveCount] = await Promise.all([
      db.collection("postLikes").where("postId", "==", id).get(),
      db.collection("postSaves").where("postId", "==", id).get(),
      db.collection("postLikes").where("postId", "==", id).count().get(),
      db.collection("postSaves").where("postId", "==", id).count().get(),
    ]);

    return NextResponse.json({
      likes: { count: likeCount.data().count, users: likes.docs.map(mapInteraction).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")) },
      saves: { count: saveCount.data().count, users: saves.docs.map(mapInteraction).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")) },
    });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
