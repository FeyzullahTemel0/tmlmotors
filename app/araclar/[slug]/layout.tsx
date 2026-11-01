import type { Metadata } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { JsonLd } from "@/components/json-ld";
import { getSiteUrl } from "@/lib/site-url";

async function loadVehicle(id: string) {
  try {
    if (!id || id.includes("/")) return null;
    const snapshot = await getAdminDb().collection("vehicles").doc(id).get();
    const data = snapshot.data();
    if (!snapshot.exists || !data || data.status !== "published") return null;
    return { id: snapshot.id, data };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await loadVehicle(slug);
  if (!vehicle) return { title: "İlan", robots: { index: false } };
  const { data } = vehicle;
  const title = String(data.title ?? `${data.brand ?? ""} ${data.model ?? ""}`).replace(/^TML MOTORS\s+/i, "").trim();
  const images = Array.isArray(data.imageUrls) ? (data.imageUrls as unknown[]).filter((item): item is string => typeof item === "string").slice(0, 3) : [];
  const summary = `${data.year ?? ""} model, ${Number(data.mileage ?? 0).toLocaleString("tr-TR")} km, ${data.fuel ?? ""} ${data.transmission ?? ""}. TML MOTORS Gaziantep.`.replace(/\s+/g, " ").trim();
  return {
    title,
    description: summary,
    alternates: { canonical: `/araclar/${vehicle.id}` },
    openGraph: { title, description: summary, images, type: "website" },
  };
}

export default async function VehicleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = await loadVehicle(slug);
  let structured: Record<string, unknown> | null = null;
  if (vehicle) {
    const { data } = vehicle;
    const siteUrl = getSiteUrl();
    const images = Array.isArray(data.imageUrls) ? (data.imageUrls as unknown[]).filter((item): item is string => typeof item === "string").slice(0, 6) : [];
    const price = typeof data.price === "number" ? data.price : null;
    structured = {
      "@context": "https://schema.org",
      "@type": "Vehicle",
      name: String(data.title ?? ""),
      brand: { "@type": "Brand", name: String(data.brand ?? "") },
      model: String(data.model ?? ""),
      vehicleModelDate: String(data.year ?? ""),
      mileageFromOdometer: { "@type": "QuantitativeValue", value: Number(data.mileage ?? 0), unitCode: "KMT" },
      fuelType: String(data.fuel ?? ""),
      vehicleTransmission: String(data.transmission ?? ""),
      bodyType: String(data.bodyType ?? ""),
      color: String(data.color ?? ""),
      url: `${siteUrl}/araclar/${vehicle.id}`,
      ...(images.length ? { image: images } : {}),
      ...(price !== null ? { offers: { "@type": "Offer", price, priceCurrency: "TRY", availability: "https://schema.org/InStock", seller: { "@type": "AutoDealer", name: "TML MOTORS" } } } : {}),
    };
  }
  return (
    <>
      {structured ? <JsonLd data={structured} /> : null}
      {children}
    </>
  );
}
