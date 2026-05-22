import { NextResponse } from "next/server";
import { fetchUsProgramTrading } from "@/lib/kis-us";

export async function GET() {
  try {
    const data = await fetchUsProgramTrading();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch US program trading" }, { status: 500 });
  }
}
