import type { User } from "firebase/auth";

export type R2ImageCategory = "vehicles" | "blog" | "ads" | "profile" | "dealer";

const maxFileSize: Record<R2ImageCategory, number> = {
  vehicles: 8 * 1024 * 1024,
  blog: 8 * 1024 * 1024,
  ads: 8 * 1024 * 1024,
  profile: 5 * 1024 * 1024,
  dealer: 8 * 1024 * 1024,
};

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export async function uploadImageToR2(file: File, category: R2ImageCategory, user: User): Promise<string> {
  if (!allowedTypes.has(file.type)) throw new Error("Yalnızca JPG, PNG, WebP, AVIF veya GIF görseller yüklenebilir.");
  if (file.size === 0 || file.size > maxFileSize[category]) {
    throw new Error(`Görsel en fazla ${Math.floor(maxFileSize[category] / 1024 / 1024)} MB olabilir.`);
  }

  const token = await user.getIdToken();
  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ category, contentType: file.type, size: file.size }),
  });
  const result = await response.json() as { uploadUrl?: string; publicUrl?: string; error?: string };
  if (!response.ok) throw new Error(result.error ?? "R2 yükleme bağlantısı oluşturulamadı.");
  if (!result.uploadUrl || !result.publicUrl) throw new Error("R2 yükleme bağlantısı eksik döndü.");

  const uploadResponse = await fetch(result.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadResponse.ok) throw new Error("Görsel R2'ye yüklenemedi. R2 CORS ayarlarını kontrol edin.");
  return result.publicUrl;
}
