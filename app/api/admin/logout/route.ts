import { NextResponse } from "next/server";
import { destroyAdminSessionCookie } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookie = destroyAdminSessionCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

