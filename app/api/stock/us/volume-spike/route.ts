import { NextResponse } from "next/server";
import { fetchUsVolumeSpike } from "@/lib/kis-us";

export async function GET() {
  try {
    const data = await fetchUsVolumeSpike();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch US volume spike" }, { status: 500 });
  }
}
