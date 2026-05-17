import { NextResponse } from "next/server";
import { fetchProgramTrading } from "@/lib/kis";

export async function GET() {
  try {
    const data = await fetchProgramTrading();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch program trading" }, { status: 500 });
  }
}
