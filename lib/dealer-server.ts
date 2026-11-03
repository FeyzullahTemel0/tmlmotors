import { InputError } from "@/lib/firebase-admin";
import { isAllowedUploadedImageUrl } from "@/lib/r2";

export type DealerProfile = {
  businessName: string;
  slug: string;
  about: string;
  phone: string;
  city: string;
  address: string;
  sahibindenUrl: string;
  arabamUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
  photos: string[];
};

const linkRules: { key: keyof DealerProfile; label: string; hosts?: string[] }[] = [
  { key: "sahibindenUrl", label: "sahibinden.com", hosts: ["sahibinden.com"] },
  { key: "arabamUrl", label: "arabam.com", hosts: ["arabam.com"] },
  { key: "instagramUrl", label: "Instagram", hosts: ["instagram.com"] },
  { key: "facebookUrl", label: "Facebook", hosts: ["facebook.com", "fb.com"] },
  { key: "youtubeUrl", label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { key: "websiteUrl", label: "web sitesi" },
];

const text = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/[ \t]+/g, " ").trim().slice(0, max) : "");

function cleanUrl(value: unknown, label: string, hosts?: string[]): string {
  const raw = text(value, 300);
  if (!raw) return "";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new InputError(`${label} bağlantısı geçerli değil.`);
  }
  if (url.protocol !== "https:") throw new InputError(`${label} bağlantısı https:// ile başlamalıdır.`);
  const host = url.hostname.toLowerCase();
  if (hosts && !hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
    throw new InputError(`${label} alanına ${hosts[0]} adresi girilmelidir.`);
  }
  return url.toString();
}

export function slugify(value: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (char) => map[char] ?? char)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function validateDealerProfile(body: Record<string, unknown> | null, uid: string, currentSlug: string): DealerProfile {
  if (!body) throw new InputError("Profil verisi okunamadı.");
  const businessName = text(body.businessName, 80);
  if (businessName.length < 2) throw new InputError("İşletme adı gereklidir.");
  const photosInput = Array.isArray(body.photos) ? body.photos : [];
  const photos = photosInput.filter((item): item is string => typeof item === "string").map((item) => item.trim());
  if (photos.length > 5) throw new InputError("En fazla 5 fotoğraf ekleyebilirsiniz.");
  if (photos.some((photo) => !isAllowedUploadedImageUrl(photo))) throw new InputError("Fotoğraflar yalnızca site üzerinden yüklenebilir.");

  const links = {} as Record<string, string>;
  for (const rule of linkRules) links[rule.key] = cleanUrl(body[rule.key], rule.label, rule.hosts);

  return {
    businessName,
    slug: currentSlug || `${slugify(businessName) || "galeri"}-${uid.slice(0, 5).toLowerCase()}`,
    about: text(body.about, 1500),
    phone: text(body.phone, 24),
    city: text(body.city, 60),
    address: text(body.address, 200),
    sahibindenUrl: links.sahibindenUrl,
    arabamUrl: links.arabamUrl,
    instagramUrl: links.instagramUrl,
    facebookUrl: links.facebookUrl,
    youtubeUrl: links.youtubeUrl,
    websiteUrl: links.websiteUrl,
    photos,
  };
}

export function publicDealer(data: FirebaseFirestore.DocumentData) {
  return {
    businessName: String(data.businessName ?? ""),
    slug: String(data.slug ?? ""),
    about: String(data.about ?? ""),
    phone: String(data.phone ?? ""),
    city: String(data.city ?? ""),
    address: String(data.address ?? ""),
    sahibindenUrl: String(data.sahibindenUrl ?? ""),
    arabamUrl: String(data.arabamUrl ?? ""),
    instagramUrl: String(data.instagramUrl ?? ""),
    facebookUrl: String(data.facebookUrl ?? ""),
    youtubeUrl: String(data.youtubeUrl ?? ""),
    websiteUrl: String(data.websiteUrl ?? ""),
    photos: Array.isArray(data.photos) ? (data.photos as unknown[]).filter((photo): photo is string => typeof photo === "string") : [],
  };
}
