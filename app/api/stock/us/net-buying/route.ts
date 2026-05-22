import { NextResponse } from "next/server";
import { fetchUsNetBuying } from "@/lib/kis-us";

export async function GET() {
  try {
    const data = await fetchUsNetBuying();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch US net buying" }, { status: 500 });
  }
}
