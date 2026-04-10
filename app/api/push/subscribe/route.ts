import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { savePushSubscription } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await ensureSchema();
    await savePushSubscription({
      endpoint: body.endpoint,
      p256dh: body.keys?.p256dh,
      auth: body.keys?.auth,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "푸시 구독 저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
