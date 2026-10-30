import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAuthenticatedUser } from "@/lib/firebase-admin";

type EngagementType = "like" | "save";

function getEngagementCollection(type: EngagementType) {
  return type === "like" ? "postLikes" : "postSaves";
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const db = getAdminDb();
    const postSnapshot = await db.collection("blogPosts").where("slug", "==", slug).limit(1).get();
    const post = postSnapshot.docs[0];
    if (!post || post.data().published !== true) return NextResponse.json({ error: "Yazı bulunamadı." }, { status: 404 });

    const authorization = request.headers.get("authorization");
    const user = authorization ? await requireAuthenticatedUser(request) : null;
    const [likes, saves, likeByUser, saveByUser] = await Promise.all([
      db.collection("postLikes").where("postId", "==", post.id).count().get(),
      db.collection("postSaves").where("postId", "==", post.id).count().get(),
      user ? db.collection("postLikes").doc(`${post.id}_${user.uid}`).get() : Promise.resolve(null),
      user ? db.collection("postSaves").doc(`${post.id}_${user.uid}`).get() : Promise.resolve(null),
    ]);

    return NextResponse.json({
      likes: likes.data().count,
      saves: saves.data().count,
      liked: likeByUser?.exists ?? false,
      saved: saveByUser?.exists ?? false,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new InputError("Etkileşim bilgisi geçersiz.");
    const { type, enabled } = body as { type?: unknown; enabled?: unknown };
    if (type !== "like" && type !== "save") throw new InputError("Beğeni veya kaydetme işlemi seçilmelidir.");
    if (typeof enabled !== "boolean") throw new InputError("Etkileşim durumu geçersiz.");

    const { slug } = await context.params;
    const db = getAdminDb();
    const postSnapshot = await db.collection("blogPosts").where("slug", "==", slug).limit(1).get();
    const post = postSnapshot.docs[0];
    if (!post || post.data().published !== true) return NextResponse.json({ error: "Yazı bulunamadı." }, { status: 404 });

    const engagementType: EngagementType = type;
    const collection = getEngagementCollection(engagementType);
    const engagementRef = db.collection(collection).doc(`${post.id}_${user.uid}`);
    const notificationRef = db.collection("adminNotifications").doc();
    const profileRef = db.collection("users").doc(user.uid);
    const displayName = typeof user.name === "string" && user.name.trim()
      ? user.name.trim().slice(0, 120)
      : user.email?.split("@")[0] ?? "TML MOTORS üyesi";

    await db.runTransaction(async (transaction) => {
      const [engagementSnapshot, profileSnapshot] = await Promise.all([
        transaction.get(engagementRef),
        engagementType === "save" ? transaction.get(profileRef) : Promise.resolve(null),
      ]);
      if (engagementSnapshot.exists === enabled) {
        if (engagementType === "save") {
          const currentSlugs = Array.isArray(profileSnapshot?.data()?.savedBlogSlugs)
            ? profileSnapshot.data()!.savedBlogSlugs.filter((value: unknown): value is string => typeof value === "string")
            : [];
          const containsPost = currentSlugs.includes(slug);
          if (containsPost !== enabled) {
            transaction.set(profileRef, {
              savedBlogSlugs: enabled ? [...new Set([...currentSlugs, slug])] : currentSlugs.filter((value: string) => value !== slug),
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }
        }
        return;
      }

      if (enabled) {
        const engagement = {
          postId: post.id,
          postSlug: slug,
          postTitle: String(post.data().title ?? ""),
          userId: user.uid,
          userName: displayName,
          userEmail: user.email ?? "",
          createdAt: FieldValue.serverTimestamp(),
        };
        transaction.create(engagementRef, engagement);
        transaction.create(notificationRef, {
          ...engagement,
          type: engagementType,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });

        if (engagementType === "save") {
          const savedSlugs = Array.isArray(profileSnapshot?.data()?.savedBlogSlugs)
            ? profileSnapshot.data()!.savedBlogSlugs.filter((value: unknown): value is string => typeof value === "string")
            : [];
          if (!savedSlugs.includes(slug) && savedSlugs.length >= 100) throw new InputError("Kaydedilmiş yazı sınırına ulaştınız.");
          transaction.set(profileRef, {
            savedBlogSlugs: [...new Set([...savedSlugs, slug])],
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      } else {
        transaction.delete(engagementRef);
        if (engagementType === "save") {
          const savedSlugs = Array.isArray(profileSnapshot?.data()?.savedBlogSlugs)
            ? profileSnapshot.data()!.savedBlogSlugs.filter((value: unknown): value is string => typeof value === "string")
            : [];
          transaction.set(profileRef, {
            savedBlogSlugs: savedSlugs.filter((savedSlug: string) => savedSlug !== slug),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
