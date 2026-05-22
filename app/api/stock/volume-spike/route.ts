import { NextResponse } from "next/server";
import { fetchVolumeSpike } from "@/lib/kis";

export async function GET() {
  try {
    const data = await fetchVolumeSpike();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch volume spike" }, { status: 500 });
  }
}
