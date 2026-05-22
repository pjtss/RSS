import { NextResponse } from "next/server";
import { fetchUsNewHigh } from "@/lib/kis-us";

export async function GET() {
  try {
    const data = await fetchUsNewHigh();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch US new high" }, { status: 500 });
  }
}
