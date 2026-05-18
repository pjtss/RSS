"use client";

import { useState, useEffect } from "react";
import { PageNavigation } from "@/components/page-navigation";
import {
  getNotificationHistory,
  markAllRead,
  markRecordRead,
  deleteNotificationRecord,
  clearNotificationHistory,
  type NotificationRecord,
} from "@/lib/notification-history";
import styles from "./page.module.css";

const LEVEL_CONFIG: Record<string, { cls: string; emoji: string }> = {
  최강호재: { cls: "super", emoji: "🚨" },
  호재가능: { cls: "bullish", emoji: "⚡" },
  악재: { cls: "bearish", emoji: "📉" },
  중립: { cls: "neutral", emoji: "➖" },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export default function NotificationsPage() {
  const [records, setRecords] = useState<NotificationRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "DART" | "SEC">("all");

  useEffect(() => {
    setRecords(getNotificationHistory());
  }, []);

  const filtered = records.filter((r) => {
    if (filter === "unread") return !r.read;
    if (filter === "DART") return r.source === "DART";
    if (filter === "SEC") return r.source === "SEC";
    return true;
  });

  const unreadCount = records.filter((r) => !r.read).length;

  function handleMarkAllRead() {
    setRecords(markAllRead());
  }

  function handleMarkRead(id: string) {
    setRecords(markRecordRead(id));
  }

  function handleDelete(id: string) {
    setRecords(deleteNotificationRecord(id));
  }

  function handleClear() {
    if (!confirm("모든 알림 이력을 삭제하시겠습니까?")) return;
    clearNotificationHistory();
    setRecords([]);
  }

  return (
    <main className={styles.page}>
      <PageNavigation current="notifications" />

      <header className={styles.hero}>
        <p className={styles.kicker}>NOTIFICATION INBOX</p>
        <h1 className={styles.heroTitle}>🔔 알림 이력 센터</h1>
        <p className={styles.heroDesc}>
          수신한 공시 알림을 한 곳에서 확인하고 관리하세요.
        </p>
      </header>

      <section className={styles.content}>
        {/* 필터 탭 + 액션 버튼 */}
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            {(["all", "unread", "DART", "SEC"] as const).map((tab) => (
              <button
                key={tab}
                id={`notif-filter-${tab}`}
                className={`${styles.tabBtn} ${filter === tab ? styles.tabActive : ""}`}
                onClick={() => setFilter(tab)}
              >
                {tab === "all" && `전체 (${records.length})`}
                {tab === "unread" && `읽지 않음 (${unreadCount})`}
                {tab === "DART" && `DART`}
                {tab === "SEC" && `SEC`}
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            <button
              id="notif-mark-all-read-btn"
              className={styles.actionBtn}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              ✅ 모두 읽음
            </button>
            <button
              id="notif-clear-btn"
              className={`${styles.actionBtn} ${styles.dangerBtn}`}
              onClick={handleClear}
              disabled={records.length === 0}
            >
              🗑 전체 삭제
            </button>
          </div>
        </div>

        {/* 이력 목록 */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔕</span>
            <p>표시할 알림 이력이 없습니다.</p>
            <p className={styles.emptyHint}>
              공시 알림을 수신하면 여기에 자동으로 기록됩니다.
            </p>
          </div>
        ) : (
          <ul className={styles.list}>
            {filtered.map((rec) => {
              const cfg = LEVEL_CONFIG[rec.level] ?? LEVEL_CONFIG["중립"];
              return (
                <li
                  key={rec.id}
                  className={`${styles.item} ${!rec.read ? styles.unread : ""} ${styles[cfg.cls] ?? ""}`}
                  onClick={() => handleMarkRead(rec.id)}
                >
                  <div className={styles.itemLeft}>
                    <span className={styles.levelEmoji}>{cfg.emoji}</span>
                    <div className={styles.itemBody}>
                      <div className={styles.itemTop}>
                        <span className={styles.company}>{rec.company}</span>
                        <span className={`${styles.levelBadge} ${styles[`badge_${cfg.cls}`]}`}>
                          {rec.level}
                        </span>
                        <span className={styles.sourceBadge}>{rec.source}</span>
                        {!rec.read && <span className={styles.unreadDot} />}
                      </div>
                      <p className={styles.title}>{rec.title}</p>
                      <div className={styles.itemMeta}>
                        <span>{formatTime(rec.receivedAt)}</span>
                        <a
                          href={rec.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.viewLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔗 원문 보기
                        </a>
                      </div>
                    </div>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(rec.id);
                    }}
                    aria-label="알림 삭제"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
