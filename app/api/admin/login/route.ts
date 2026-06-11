import { NextResponse } from "next/server";
import { createAdminSessionCookie, verifyAdminPassword, isAdminConfigured } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "ADMIN_DASHBOARD_PASSWORD 환경변수가 설정되지 않았습니다." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password ?? "");

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  const cookie = createAdminSessionCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

