import { NextResponse } from "next/server";
import { apiError, getAdminDb, InputError, requireAdmin } from "@/lib/firebase-admin";

const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
const statuses = ["new", "contacted", "closed"];

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getAdminDb().collection("sellRequests").orderBy("createdAt", "desc").limit(200).get();
    const requests = snapshot.docs.map((document) => ({ id: document.id, ...document.data(), createdAt: millis(document.data().createdAt) }));
    return NextResponse.json({ requests }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json() as Record<string, unknown> | null;
    const id = typeof body?.id === "string" ? body.id : "";
    const status = typeof body?.status === "string" ? body.status : "";
    if (!id || id.includes("/") || !statuses.includes(status)) throw new InputError("Geçersiz istek.");
    await getAdminDb().collection("sellRequests").doc(id).update({ status });
    return NextResponse.json({ id, status });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!id || id.includes("/")) throw new InputError("Geçersiz istek.");
    await getAdminDb().collection("sellRequests").doc(id).delete();
    return NextResponse.json({ id });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
