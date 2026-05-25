import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "실시간 OPEN DART 빠른 공시 기능이 비활성화되었습니다." },
    { status: 410 }
  );
}
