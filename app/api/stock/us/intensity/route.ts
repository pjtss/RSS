import { NextResponse } from "next/server";
import { fetchUsTradingIntensity } from "@/lib/kis-us";

export async function GET() {
  try {
    const data = await fetchUsTradingIntensity();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch US intensity" }, { status: 500 });
  }
}
