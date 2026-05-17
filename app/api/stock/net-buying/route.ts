import { NextResponse } from "next/server";
import { fetchNetBuying } from "@/lib/kis";

export async function GET() {
  try {
    const data = await fetchNetBuying();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch net buying" }, { status: 500 });
  }
}
