"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./score-ranking.module.css";

interface RankedItem {
  company: string;
  title: string;
  judgment: string;
  score: number;
  keywords: string[];
  publishedAt: string;
  link: string;
}

const JUDGMENT_CONFIG: Record<string, { label: string; cls: string; emoji: string }> = {
  최강호재: { label: "최강호재", cls: "super", emoji: "🚨" },
  호재가능: { label: "호재가능", cls: "bullish", emoji: "⚡" },
  악재: { label: "악재", cls: "bearish", emoji: "📉" },
  중립: { label: "중립", cls: "neutral", emoji: "➖" },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function ScoreRanking() {
  const [items, setItems] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dart/ranking", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setFetchedAt(data.fetchedAt ?? "");
    } catch (e) {
      setError("데이터를 불러오지 못했습니다.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  const refreshTime = fetchedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date(fetchedAt))
    : "";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>🏆</span>
          <h2 className={styles.title}>호재 스코어 랭킹</h2>
          {refreshTime && <span className={styles.refreshTime}>갱신 {refreshTime}</span>}
        </div>
        <button
          id="score-ranking-refresh-btn"
          className={styles.refreshBtn}
          onClick={load}
          disabled={loading}
          aria-label="랭킹 새로고침"
        >
          {loading ? "⏳" : "↻"}
        </button>
      </div>

      <p className={styles.desc}>
        오늘 DART 공시를 Stockman 알고리즘으로 점수화하여 실시간 랭킹으로 보여줍니다.
      </p>

      {loading && items.length === 0 && (
        <div className={styles.loadingRow}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className={styles.empty}>오늘 공시된 호재 데이터가 없습니다.</p>
      )}

      <ol className={styles.list}>
        {items.map((item, idx) => {
          const cfg = JUDGMENT_CONFIG[item.judgment] ?? JUDGMENT_CONFIG["중립"];
          return (
            <li key={`${item.link}-${idx}`} className={`${styles.listItem} ${styles[cfg.cls]}`}>
              <span className={styles.rank}>
                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
              </span>
              <div className={styles.info}>
                <div className={styles.topRow}>
                  <span className={styles.company}>{item.company}</span>
                  <span className={`${styles.judgmentBadge} ${styles[`badge_${cfg.cls}`]}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                  <span className={styles.score}>+{item.score}점</span>
                </div>
                <a
                  className={styles.titleLink}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.title}
                </a>
                <div className={styles.meta}>
                  {item.keywords.length > 0 && (
                    <span className={styles.keywords}>
                      {item.keywords.map((k) => `#${k}`).join(" ")}
                    </span>
                  )}
                  <span className={styles.time}>{formatTime(item.publishedAt)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
