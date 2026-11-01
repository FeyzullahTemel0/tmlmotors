import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiError, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";
import { blogCategories, normalizeBlogCategory } from "@/lib/blog-categories";

const text = (value: unknown, length: number) => typeof value === "string" ? value.trim().slice(0, length) : "";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getAdminDb().collection("blogPosts").orderBy("createdAt", "desc").limit(100).get();
    return NextResponse.json({ posts: snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const title = text(body?.title, 160);
    const slug = text(body?.slug, 160).toLocaleLowerCase("tr-TR");
    const excerpt = text(body?.excerpt, 500);
    const content = text(body?.content, 50000);
    if (typeof body?.category !== "string" || !blogCategories.includes(body.category)) throw new InputError("Bir blog kategorisi seçin.");
    const category = normalizeBlogCategory(body.category);
    if (!title || !slug || !excerpt || !content) throw new InputError("Başlık, bağlantı adı, özet ve içerik zorunludur.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new InputError("Bağlantı adı yalnızca küçük harf, rakam ve tire içerebilir.");

    const db = getAdminDb();
    const duplicate = await db.collection("blogPosts").where("slug", "==", slug).limit(1).get();
    if (!duplicate.empty) throw new InputError("Bu bağlantı adı başka bir yazıda kullanılıyor.");
    const result = await db.collection("blogPosts").add({
      title, slug, excerpt, content, category, coverImageUrl: text(body?.coverImageUrl, 1500),
      published: Boolean(body?.published), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const id = text(body?.id, 128);
    const title = text(body?.title, 160);
    const slug = text(body?.slug, 160).toLocaleLowerCase("tr-TR");
    const excerpt = text(body?.excerpt, 500);
    const content = text(body?.content, 50000);
    if (typeof body?.category !== "string" || !blogCategories.includes(body.category)) throw new InputError("Bir blog kategorisi seçin.");
    const category = normalizeBlogCategory(body.category);
    if (!id || !title || !slug || !excerpt || !content) throw new InputError("Yazı alanları eksik.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new InputError("Bağlantı adı yalnızca küçük harf, rakam ve tire içerebilir.");
    const db = getAdminDb();
    const reference = db.collection("blogPosts").doc(id);
    if (!(await reference.get()).exists) return NextResponse.json({ error: "Blog yazısı bulunamadı." }, { status: 404 });
    const duplicate = await db.collection("blogPosts").where("slug", "==", slug).limit(2).get();
    if (duplicate.docs.some((document) => document.id !== id)) throw new InputError("Bu bağlantı adı başka bir yazıda kullanılıyor.");
    await reference.set({
      title, slug, excerpt, content, category, coverImageUrl: text(body?.coverImageUrl, 1500),
      published: Boolean(body?.published), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const id = text(body?.id, 128);
    if (!id) throw new InputError("Silinecek yazı seçilmedi.");
    const reference = getAdminDb().collection("blogPosts").doc(id);
    if (!(await reference.get()).exists) return NextResponse.json({ error: "Blog yazısı bulunamadı." }, { status: 404 });
    await reference.delete();
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
