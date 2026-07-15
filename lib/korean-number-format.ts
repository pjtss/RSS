export function formatKoreanAmount(value: number) {
  if (!Number.isFinite(value)) return "-";
  const amount = Math.round(Math.abs(value));
  const sign = value < 0 ? "-" : "";
  const eok = Math.floor(amount / 100_000_000);
  const man = Math.floor((amount % 100_000_000) / 10_000);
  const remainder = amount % 10_000;
  const parts: string[] = [];

  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${man}만`);
  if (remainder > 0 || parts.length === 0) parts.push(String(remainder));
  return `${sign}${parts.join(" ")}`;
}
