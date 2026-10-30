import { NextResponse } from "next/server";
import { apiError, requireAdmin } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    return NextResponse.json({ email: admin.email });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
