import { NextResponse } from "next/server";

// Frankfurter, Avrupa Merkez Bankası kurlarını ücretsiz sunar; anahtar gerektirmez.
const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest?base=TRY&symbols=USD,EUR,GBP";

export async function GET() {
  try {
    const response = await fetch(FRANKFURTER_URL, { next: { revalidate: 21600 } });
    if (!response.ok) throw new Error(`Kur servisi ${response.status} döndürdü.`);
    const data = (await response.json()) as { rates?: Record<string, number> };
    const rates = data.rates ?? {};
    return NextResponse.json(
      { base: "TRY", rates: { TRY: 1, USD: rates.USD ?? 0, EUR: rates.EUR ?? 0, GBP: rates.GBP ?? 0 }, date: (data as { date?: string }).date ?? null },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Döviz kuru alınamadı:", error);
    return NextResponse.json({ base: "TRY", rates: { TRY: 1, USD: 0, EUR: 0, GBP: 0 }, date: null }, { status: 200 });
  }
}
