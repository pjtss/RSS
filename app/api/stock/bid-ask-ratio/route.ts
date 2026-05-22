import { NextResponse } from "next/server";
import { fetchBidAskRatio } from "@/lib/kis";

export async function GET() {
  try {
    const data = await fetchBidAskRatio();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch bid/ask ratio" }, { status: 500 });
  }
}
