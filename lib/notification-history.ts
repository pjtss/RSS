"use client";

export const NOTIFICATION_HISTORY_KEY = "rss_notification_history";
export const MAX_HISTORY_SIZE = 200;

export interface NotificationRecord {
  id: string;
  source: "DART" | "SEC";
  company: string;
  title: string;
  level: string;
  link: string;
  receivedAt: string;
  read: boolean;
}

export function getNotificationHistory(): NotificationRecord[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveNotificationHistory(records: NotificationRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(records));
}

export function appendNotificationRecord(
  record: Omit<NotificationRecord, "id" | "receivedAt" | "read">
): NotificationRecord[] {
  const current = getNotificationHistory();
  const newRecord: NotificationRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    receivedAt: new Date().toISOString(),
    read: false,
  };
  // 최신이 맨 앞, 최대 200건 유지
  const updated = [newRecord, ...current].slice(0, MAX_HISTORY_SIZE);
  saveNotificationHistory(updated);
  return updated;
}

export function markAllRead(): NotificationRecord[] {
  const updated = getNotificationHistory().map((r) => ({ ...r, read: true }));
  saveNotificationHistory(updated);
  return updated;
}

export function markRecordRead(id: string): NotificationRecord[] {
  const updated = getNotificationHistory().map((r) =>
    r.id === id ? { ...r, read: true } : r
  );
  saveNotificationHistory(updated);
  return updated;
}

export function deleteNotificationRecord(id: string): NotificationRecord[] {
  const updated = getNotificationHistory().filter((r) => r.id !== id);
  saveNotificationHistory(updated);
  return updated;
}

export function clearNotificationHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(NOTIFICATION_HISTORY_KEY);
}

export function getUnreadCount(): number {
  return getNotificationHistory().filter((r) => !r.read).length;
}
