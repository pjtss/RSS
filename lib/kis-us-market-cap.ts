/** Reads KIS's market-capitalization value from the price-detail output unchanged. */
export function calculateKisUsMarketCap(detail: Record<string, unknown>): number | null {
  return parsePositiveNumber(detail.tomv);
}

function parsePositiveNumber(value: unknown): number | null {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
