import { NextResponse } from "next/server";
import { fetchUsTradingIntensity } from "@/lib/kis-us";

export async function GET() {
  try {
    const data = await fetchUsTradingIntensity();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({
      error: "Failed to fetch US intensity",
      message: err.message || String(err),
      stack: err.stack
    }, { status: 500 });
  }
}
