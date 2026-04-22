import { NextResponse } from "next/server";
import { getTodaySecBullishFeed, syncSecAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await syncSecAlerts();
    const payload = await getTodaySecBullishFeed();
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEC 데이터를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
