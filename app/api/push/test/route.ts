import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { sendTestPush } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await ensureSchema();
    await sendTestPush();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "테스트 푸시 발송에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
