"use client";

export const STOCK_ALERTS_KEY = "rss_stock_alerts";

export interface StockAlertConfig {
  company: string;
  /** 최강호재만 받을지 여부 */
  superOnly: boolean;
  addedAt: string;
}

export function getStockAlerts(): StockAlertConfig[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STOCK_ALERTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveStockAlerts(configs: StockAlertConfig[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STOCK_ALERTS_KEY, JSON.stringify(configs));
}

export function addStockAlert(company: string, superOnly = false): StockAlertConfig[] {
  const current = getStockAlerts();
  const trimmed = company.trim();
  if (!trimmed || current.some((c) => c.company === trimmed)) return current;
  const updated: StockAlertConfig[] = [
    ...current,
    { company: trimmed, superOnly, addedAt: new Date().toISOString() },
  ];
  saveStockAlerts(updated);
  return updated;
}

export function removeStockAlert(company: string): StockAlertConfig[] {
  const updated = getStockAlerts().filter((c) => c.company !== company);
  saveStockAlerts(updated);
  return updated;
}

export function toggleSuperOnly(company: string): StockAlertConfig[] {
  const updated = getStockAlerts().map((c) =>
    c.company === company ? { ...c, superOnly: !c.superOnly } : c
  );
  saveStockAlerts(updated);
  return updated;
}

/**
 * 알림이 해당 종목 구독 설정에 해당하는지 판단
 * (클라이언트 측 필터링에 사용)
 */
export function isAlertMatchingStockConfig(
  company: string,
  level: string,
  configs: StockAlertConfig[]
): boolean {
  if (configs.length === 0) return true; // 구독 없으면 전체 허용
  const match = configs.find(
    (c) => c.company === company || company.includes(c.company) || c.company.includes(company)
  );
  if (!match) return false;
  if (match.superOnly && level !== "최강호재") return false;
  return true;
}
