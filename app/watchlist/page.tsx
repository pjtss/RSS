"use client";

import { useState, useEffect, useCallback } from "react";
import { PageNavigation } from "@/components/page-navigation";
import { CompanyTimeline } from "@/components/company-timeline";
import { getWatchlist, toggleWatchlist } from "@/lib/watchlist";
import styles from "./page.module.css";

interface RankedItem {
  company: string;
  title: string;
  judgment: string;
  score: number;
  keywords: string[];
  publishedAt: string;
  link: string;
}

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

const JUDGMENT_CFG: Record<string, { emoji: string; cls: string }> = {
  최강호재: { emoji: "🚨", cls: "super" },
  호재가능: { emoji: "⚡", cls: "bullish" },
  악재: { emoji: "📉", cls: "bearish" },
  중립: { emoji: "➖", cls: "neutral" },
};

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [allItems, setAllItems] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineCompany, setTimelineCompany] = useState<string | null>(null);
  const [newStock, setNewStock] = useState("");

  useEffect(() => {
    setWatchlist(getWatchlist());
  }, []);

  const loadRanking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dart/ranking", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAllItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRanking();
    const t = setInterval(loadRanking, 60_000);
    return () => clearInterval(t);
  }, [loadRanking]);

  // watchlist에 속한 공시 필터링
  const watchedItems = allItems.filter((item) =>
    watchlist.some(
      (w) =>
        item.company.includes(w) ||
        w.includes(item.company)
    )
  );

  function handleToggle(company: string) {
    setWatchlist(toggleWatchlist(company));
  }

  function handleAdd() {
    const trimmed = newStock.trim();
    if (!trimmed || watchlist.includes(trimmed)) return;
    setWatchlist(toggleWatchlist(trimmed));
    setNewStock("");
  }

  function handleRemove(company: string) {
    setWatchlist(toggleWatchlist(company));
  }

  return (
    <main className={styles.page}>
      <PageNavigation current="watchlist" />

      <header className={styles.hero}>
        <p className={styles.kicker}>MY WATCHLIST</p>
        <h1 className={styles.heroTitle}>⭐ 관심 종목 대시보드</h1>
        <p className={styles.heroDesc}>
          관심 종목에 발생한 공시를 실시간으로 추적하고 이력을 조회하세요.
        </p>
      </header>

      <div className={styles.layout}>
        {/* 사이드바: 관심 종목 관리 */}
        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>⭐ 관심 종목 관리</h2>
            <div className={styles.addForm}>
              <input
                id="watchlist-add-input"
                className={styles.input}
                type="text"
                placeholder="종목명 입력"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <button
                id="watchlist-add-btn"
                className={styles.addBtn}
                onClick={handleAdd}
              >
                추가
              </button>
            </div>
            {watchlist.length === 0 ? (
              <p className={styles.emptyList}>관심 종목이 없습니다.</p>
            ) : (
              <ul className={styles.stockList}>
                {watchlist.map((company) => (
                  <li key={company} className={styles.stockItem}>
                    <button
                      className={styles.companyBtn}
                      onClick={() => setTimelineCompany(company)}
                      title="공시 이력 보기"
                    >
                      <span className={styles.starIcon}>⭐</span>
                      <span className={styles.stockName}>{company}</span>
                      {watchedItems.some((i) =>
                        i.company.includes(company) || company.includes(i.company)
                      ) && <span className={styles.activeDot} title="오늘 공시 있음" />}
                    </button>
                    <button
                      className={styles.removeStockBtn}
                      onClick={() => handleRemove(company)}
                      aria-label={`${company} 관심 종목 해제`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* 메인: 관심 종목 공시 피드 */}
        <section className={styles.main}>
          <div className={styles.card}>
            <div className={styles.feedHeader}>
              <h2 className={styles.cardTitle}>📋 관심 종목 오늘 공시</h2>
              <button
                id="watchlist-refresh-btn"
                className={styles.refreshBtn}
                onClick={loadRanking}
                disabled={loading}
              >
                {loading ? "⏳" : "↻"}
              </button>
            </div>

            {loading && watchedItems.length === 0 && (
              <div className={styles.skeletonWrap}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={styles.skeleton} />
                ))}
              </div>
            )}

            {!loading && watchlist.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>⭐</span>
                <p>좌측에서 관심 종목을 추가하세요.</p>
              </div>
            )}

            {!loading && watchlist.length > 0 && watchedItems.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📭</span>
                <p>오늘 관심 종목의 공시가 없습니다.</p>
              </div>
            )}

            <ul className={styles.feedList}>
              {watchedItems.map((item, idx) => {
                const cfg = JUDGMENT_CFG[item.judgment] ?? JUDGMENT_CFG["중립"];
                return (
                  <li
                    key={`${item.link}-${idx}`}
                    className={`${styles.feedItem} ${styles[cfg.cls]}`}
                  >
                    <div className={styles.feedTop}>
                      <span className={styles.feedEmoji}>{cfg.emoji}</span>
                      <span className={styles.feedCompany}>{item.company}</span>
                      <span className={`${styles.feedBadge} ${styles[`badge_${cfg.cls}`]}`}>
                        {item.judgment}
                      </span>
                      <span className={styles.feedScore}>+{item.score}점</span>
                      <span className={styles.feedTime}>{formatTime(item.publishedAt)}</span>
                    </div>
                    <a
                      className={styles.feedTitle}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title}
                    </a>
                    <div className={styles.feedMeta}>
                      {item.keywords.length > 0 && (
                        <span className={styles.feedKeywords}>
                          {item.keywords.map((k) => `#${k}`).join(" ")}
                        </span>
                      )}
                      <button
                        className={styles.timelineBtn}
                        onClick={() => setTimelineCompany(item.company)}
                      >
                        📅 공시 이력
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      {/* 공시 이력 모달 */}
      {timelineCompany && (
        <CompanyTimeline
          company={timelineCompany}
          items={allItems}
          onClose={() => setTimelineCompany(null)}
        />
      )}
    </main>
  );
}
