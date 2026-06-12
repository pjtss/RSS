import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { loadUsTopRisingCount, saveUsTopRisingCount } from "@/lib/kis-top-n";

export async function GET() {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ topN: await loadUsTopRisingCount() });
}

export async function PATCH(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const topN = Number(body.topN);
  if (!Number.isInteger(topN) || topN < 1 || topN > 100) {
    return NextResponse.json({ error: "topN must be 1-100" }, { status: 400 });
  }
  await saveUsTopRisingCount(topN);
  return NextResponse.json({ success: true, topN });
}
