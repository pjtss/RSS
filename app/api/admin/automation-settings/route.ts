import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAutomationIntervalSeconds, saveAutomationIntervalSeconds } from "@/lib/automation-settings";

export async function GET() {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ intervalSeconds: await getAutomationIntervalSeconds() });
}

export async function PATCH(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const seconds = Number(body.intervalSeconds);
  if (!Number.isFinite(seconds) || seconds < 5 || seconds > 3600) return NextResponse.json({ error: "주기는 5~3600초 사이여야 합니다." }, { status: 400 });
  return NextResponse.json({ intervalSeconds: await saveAutomationIntervalSeconds(seconds) });
}
