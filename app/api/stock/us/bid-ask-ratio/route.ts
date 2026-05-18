import { NextResponse } from "next/server";
import { fetchUsBidAskRatio } from "@/lib/kis-us";

export async function GET() {
  try {
    const data = await fetchUsBidAskRatio();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch US bid ask ratio" }, { status: 500 });
  }
}
