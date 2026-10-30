import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { apiError, requireAdmin, requireAuthenticatedUser } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json();
    const category = body?.category;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !secret) {
      throw new Error("SERVICE_UNAVAILABLE: Cloudinary için NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_API_KEY ve CLOUDINARY_API_SECRET tanımlanmalı.");
    }

    let folder: string;
    if (category === "profile") {
      folder = `tml-motors/profiles/${user.uid}`;
    } else if (category === "vehicles" || category === "blog" || category === "ads") {
      await requireAdmin(request);
      folder = `tml-motors/${category}`;
    } else {
      return NextResponse.json({ error: "Geçersiz görsel kategorisi." }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${secret}`)
      .digest("hex");

    return NextResponse.json({ timestamp, signature, folder, apiKey, cloudName });
  } catch (error) {
    const result = apiError(error);
    const status = result.status === 503 && result.error.startsWith("Cloudinary") ? 503 : result.status;
    return NextResponse.json({ error: result.error }, { status });
  }
}
