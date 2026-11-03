import { S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID || "623839c9553455611293d8138ad58488";

export const r2Bucket = process.env.R2_BUCKET_NAME || "tmlmotors";
export const r2PublicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "https://pub-c5285a8590b045beb5f478d2bb3247aa.r2.dev").replace(/\/+$/, "");

export function getR2Client(): S3Client {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("SERVICE_UNAVAILABLE: Cloudflare R2 için R2_ACCESS_KEY_ID ve R2_SECRET_ACCESS_KEY tanımlanmalı.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function isAllowedUploadedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === new URL(r2PublicBaseUrl).hostname
      && url.pathname.length > 1;
  } catch {
    return false;
  }
}
