import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { runUsTurnoverRatioAutomation } from "@/lib/us-turnover-ratio-automation";

export const dynamic = "force-dynamic";

async function handleUsTurnoverRatio(request: Request) {
  const secret = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret") || "";
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSchema();
    return NextResponse.json({ ok: true, data: await runUsTurnoverRatioAutomation() });
  } catch (error) {
    console.error("[OCI Cron] US turnover ratio failed:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export const GET = handleUsTurnoverRatio;
export const POST = handleUsTurnoverRatio;
