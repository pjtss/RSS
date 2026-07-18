import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { ensureSchema } from "@/lib/db";
import { addUsTurnoverWatch, listUsTurnoverWatches, removeUsTurnoverWatch } from "@/lib/us-turnover-watch-repository";

function normalizeTicker(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

export async function GET() {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureSchema();
  return NextResponse.json({ watches: await listUsTurnoverWatches() });
}

export async function POST(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const ticker = normalizeTicker(body.ticker);
  const threshold = Number(body.threshold);
  if (!/^[A-Z0-9.\-]{1,12}$/.test(ticker)) return NextResponse.json({ error: "티커 형식이 올바르지 않습니다." }, { status: 400 });
  if (!Number.isFinite(threshold) || threshold < 0) return NextResponse.json({ error: "비율은 0 이상 숫자여야 합니다." }, { status: 400 });
  await ensureSchema();
  await addUsTurnoverWatch(ticker, threshold);
  return NextResponse.json({ watches: await listUsTurnoverWatches() });
}

export async function DELETE(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const ticker = normalizeTicker(body.ticker);
  if (!ticker) return NextResponse.json({ error: "티커가 필요합니다." }, { status: 400 });
  await ensureSchema();
  await removeUsTurnoverWatch(ticker);
  return NextResponse.json({ watches: await listUsTurnoverWatches() });
}
