import { NextResponse } from "next/server";
import { fetchDartFeed } from "@/lib/rss";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await fetchDartFeed();
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "DART 데이터를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
