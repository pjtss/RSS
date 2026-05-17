import { NextResponse } from "next/server";
import { fetchNewHigh } from "@/lib/kis";

export async function GET() {
  try {
    const data = await fetchNewHigh();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch new high" }, { status: 500 });
  }
}
