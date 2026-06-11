import { NextResponse } from "next/server";
import { isAdminConfigured, requireAdminSession } from "@/lib/admin-auth";
import { ADMIN_FEATURES, loadAdminFeatureFlags, setAdminFeatureFlag } from "@/lib/admin-flags";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await loadAdminFeatureFlags();
  return NextResponse.json({
    flags,
    features: ADMIN_FEATURES,
    configured: isAdminConfigured(),
  });
}

export async function PATCH(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const key = String(body.key ?? "");
  const enabled = Boolean(body.enabled);
  if (!ADMIN_FEATURES.some((feature) => feature.key === key)) {
    return NextResponse.json({ error: "Invalid feature key" }, { status: 400 });
  }

  await setAdminFeatureFlag(key as any, enabled);
  const flags = await loadAdminFeatureFlags();
  return NextResponse.json({ success: true, flags });
}
