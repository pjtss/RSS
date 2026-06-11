import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "stockman_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function getSecret() {
  return process.env.ADMIN_DASHBOARD_PASSWORD || process.env.ADMIN_PASSWORD || "";
}

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function encodeSession(exp: number, secret: string) {
  const payload = `${exp}`;
  const sig = sign(payload, secret);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

function decodeSession(token: string, secret: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [expStr, sig] = raw.split(".");
    if (!expStr || !sig) return false;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(expStr, secret)));
  } catch {
    return false;
  }
}

export function isAdminConfigured() {
  return Boolean(getSecret());
}

export function verifyAdminPassword(password: string) {
  const secret = getSecret();
  return Boolean(secret) && password === secret;
}

export function createAdminSessionCookie() {
  const secret = getSecret();
  const exp = Date.now() + SESSION_TTL_MS;
  return {
    name: COOKIE_NAME,
    value: encodeSession(exp, secret),
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    },
  };
}

export function destroyAdminSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}

export async function requireAdminSession() {
  const secret = getSecret();
  if (!secret) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return decodeSession(token, secret);
}
