export const KIS_APPKEY = process.env.KIS_APPKEY;
export const KIS_APPSECRET = process.env.KIS_APPSECRET;

export function getKisMode(): "real" | "mock" {
  if (process.env.NODE_ENV === "test") return "mock";
  return "real";
}

export function getDynamicOffset(seed: number): number {
  if (process.env.NODE_ENV === "test") return 0;
  const seconds = new Date().getSeconds();
  return Math.sin(seconds + seed) * 1.5;
}
