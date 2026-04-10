import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { loadPushSubscriptionDebug, savePushSubscription } from "@/lib/push";

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

    const debug = await loadPushSubscriptionDebug();

    return NextResponse.json({
      ok: true,
      savedCount: debug.count,
      latestUpdatedAt: debug.latest?.updatedAt ?? null,
      latestEndpoint: debug.latest?.endpoint ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "푸시 구독 저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureSchema();
    const debug = await loadPushSubscriptionDebug();
    return NextResponse.json({
      ok: true,
      savedCount: debug.count,
      latestEndpoint: debug.latest?.endpoint ?? null,
      latestUpdatedAt: debug.latest?.updatedAt ?? null,
      latestUserAgent: debug.latest?.userAgent ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "푸시 구독 상태 조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
