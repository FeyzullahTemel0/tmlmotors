import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError, getAdminDb, requireAdmin, requireAuthenticatedUser } from "@/lib/firebase-admin";
import { getR2Client, r2Bucket } from "@/lib/r2";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

const contentTypeExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json() as { category?: unknown; contentType?: unknown; size?: unknown };
    const { category, contentType, size } = body;

    if (typeof category !== "string" || !["vehicles", "blog", "ads", "profile", "dealer"].includes(category)) {
      return NextResponse.json({ error: "Geçersiz görsel kategorisi." }, { status: 400 });
    }
    if (typeof contentType !== "string" || !contentTypeExtensions[contentType]) {
      return NextResponse.json({ error: "Desteklenmeyen görsel formatı." }, { status: 400 });
    }
    const maxSize = category === "profile" ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
    if (typeof size !== "number" || !Number.isInteger(size) || size < 1 || size > maxSize) {
      return NextResponse.json({ error: `Görsel en fazla ${maxSize / 1024 / 1024} MB olabilir.` }, { status: 400 });
    }

    let folder: string;
    if (category === "profile") {
      folder = `tml-motors/profiles/${user.uid}`;
    } else if (category === "dealer") {
      const dealer = await getAdminDb().collection("dealers").doc(user.uid).get();
      if (!dealer.exists || dealer.data()?.active !== true) {
        return NextResponse.json({ error: "Galerici profili etkin değil." }, { status: 403 });
      }
      folder = `tml-motors/dealers/${user.uid}`;
    } else {
      await requireAdmin(request);
      folder = `tml-motors/${category}`;
    }

    const key = `${folder}/${randomUUID()}.${contentTypeExtensions[contentType]}`;
    const command = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 60 });
    const publicUrl = `${getSiteUrl()}/media/${key.split("/").map(encodeURIComponent).join("/")}`;
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
