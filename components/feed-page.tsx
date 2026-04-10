"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DartItem, DartJudgment, FeedPayload, SecItem, SecSentiment } from "@/lib/types";
import styles from "./feed-page.module.css";

const REFRESH_MS = 15000;
const PAGE_SIZE = 50;

type FeedKind = "dart" | "sec";
type ViewMode = "latest" | "grouped";
type FeedScope = "all" | "bullish" | "bearish";

type FeedPageProps =
  | {
      type: "dart";
      title: string;
      description: string;
      scope?: FeedScope;
    }
  | {
      type: "sec";
      title: string;
      description: string;
      scope?: FeedScope;
    };

function formatTime(value: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function judgmentClass(value: string): string {
  if (value.includes("최강호재") || value.includes("호재")) {
    return styles.good;
  }
  if (value.includes("악재")) {
    return styles.bad;
  }
  if (value.includes("중요")) {
    return styles.warn;
  }
  return styles.neutral;
}

function Navigation({ current }: { current: FeedKind }) {
  return (
    <nav className={styles.nav}>
      <Link className={current === "dart" ? styles.navActive : styles.navLink} href="/dart">
        DART
      </Link>
      <Link className={current === "sec" ? styles.navActive : styles.navLink} href="/sec">
        SEC
      </Link>
    </nav>
  );
}

function ScopeNavigation({ type, scope }: { type: FeedKind; scope: FeedScope }) {
  const items =
    type === "dart"
      ? [
          { href: "/dart", label: "전체" },
          { href: "/dart/bullish", label: "호재" },
          { href: "/dart/bearish", label: "악재" },
        ]
      : [
          { href: "/sec", label: "전체" },
          { href: "/sec/bullish", label: "호재" },
          { href: "/sec/bearish", label: "악재" },
        ];

  const activeHref =
    type === "dart"
      ? scope === "bullish"
        ? "/dart/bullish"
        : scope === "bearish"
          ? "/dart/bearish"
          : "/dart"
      : scope === "bullish"
        ? "/sec/bullish"
        : scope === "bearish"
          ? "/sec/bearish"
          : "/sec";

  return (
    <nav className={styles.scopeNav}>
      {items.map((item) => (
        <Link key={item.href} className={item.href === activeHref ? styles.scopeActive : styles.scopeLink} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function sortByPublishedAtDesc<T extends { publishedAt: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.publishedAt).getTime();
    const rightTime = new Date(right.publishedAt).getTime();
    return rightTime - leftTime;
  });
}

function paginateItems<T>(items: T[], page: number): T[] {
  const start = (page - 1) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

function filterDartItems(items: DartItem[], scope: FeedScope): DartItem[] {
  if (scope === "bullish") {
    return items.filter((item) => item.judgment === "최강호재" || item.judgment === "호재가능");
  }
  if (scope === "bearish") {
    return items.filter((item) => item.judgment === "악재");
  }
  return items;
}

function filterSecItems(items: SecItem[], scope: FeedScope): SecItem[] {
  if (scope === "bullish") {
    return items.filter((item) => item.sentiment === "호재가능");
  }
  if (scope === "bearish") {
    return items.filter((item) => item.sentiment === "악재가능");
  }
  return items;
}

function DartSections({ items }: { items: DartItem[] }) {
  const orders: DartJudgment[] = ["최강호재", "호재가능", "악재", "중립"];

  return (
    <div className={styles.groupList}>
      {orders.map((judgment) => {
        const sectionItems = items.filter((item) => item.judgment === judgment);
        if (sectionItems.length === 0) {
          return null;
        }

        return (
          <section key={judgment} className={styles.groupSection}>
            <div className={styles.groupHeader}>
              <h2>{judgment}</h2>
              <span>{sectionItems.length}건</span>
            </div>
            <DartTable items={sectionItems} />
          </section>
        );
      })}
    </div>
  );
}

function DartTable({ items }: { items: DartItem[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>판단</th>
            <th>회사명</th>
            <th>공시 제목</th>
            <th>키워드</th>
            <th>공시 시각</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.link}>
              <td>
                <span className={`${styles.badge} ${judgmentClass(item.judgment)}`}>{item.judgment}</span>
              </td>
              <td>{item.company}</td>
              <td>
                <a href={item.link} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
              </td>
              <td>{item.keywords.join(", ") || "-"}</td>
              <td>{formatTime(item.publishedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SecSections({ items }: { items: SecItem[] }) {
  const orders: SecSentiment[] = ["호재가능", "악재가능", "중요공시", "일반공시"];

  return (
    <div className={styles.groupList}>
      {orders.map((sentiment) => {
        const sectionItems = items.filter((item) => item.sentiment === sentiment);
        if (sectionItems.length === 0) {
          return null;
        }

        return (
          <section key={sentiment} className={styles.groupSection}>
            <div className={styles.groupHeader}>
              <h2>{sentiment}</h2>
              <span>{sectionItems.length}건</span>
            </div>
            <SecTable items={sectionItems} />
          </section>
        );
      })}
    </div>
  );
}

function SecTable({ items }: { items: SecItem[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>판단</th>
            <th>폼</th>
            <th>회사명</th>
            <th>공시 제목</th>
            <th>공시 시각</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.accession || item.link}>
              <td>
                <span className={`${styles.badge} ${judgmentClass(item.sentiment)}`}>{item.sentiment}</span>
              </td>
              <td>{item.formType}</td>
              <td>{item.company}</td>
              <td>
                <a href={item.link} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
              </td>
              <td>{formatTime(item.publishedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FeedPage(props: FeedPageProps) {
  const scope = props.scope ?? "all";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dartData, setDartData] = useState<FeedPayload<DartItem> | null>(null);
  const [secData, setSecData] = useState<FeedPayload<SecItem> | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("latest");
  const [page, setPage] = useState(1);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      try {
        const response = await fetch(props.type === "dart" ? "/api/dart" : "/api/sec");
        if (!response.ok) {
          throw new Error("RSS 응답을 가져오는 데 실패했습니다.");
        }

        if (props.type === "dart") {
          const data = (await response.json()) as FeedPayload<DartItem>;
          if (!cancelled) {
            setDartData(data);
          }
        } else {
          const data = (await response.json()) as FeedPayload<SecItem>;
          if (!cancelled) {
            setSecData(data);
          }
        }

        if (!cancelled) {
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
        }
      }
    }

    function stopPolling() {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function startPolling() {
      stopPolling();
      if (document.visibilityState !== "visible") {
        return;
      }

      intervalRef.current = window.setInterval(() => {
        void loadFeed();
      }, REFRESH_MS);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadFeed();
        startPolling();
        return;
      }

      stopPolling();
    }

    void loadFeed();
    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPolling();
    };
  }, [props.type]);

  useEffect(() => {
    setPage(1);
    if (scope !== "all") {
      setViewMode("latest");
    }
  }, [props.type, scope]);

  useEffect(() => {
    setPage(1);
  }, [viewMode]);

  const rawDartItems = sortByPublishedAtDesc(dartData?.items ?? []);
  const rawSecItems = sortByPublishedAtDesc(secData?.items ?? []);
  const scopedDartItems = filterDartItems(rawDartItems, scope);
  const scopedSecItems = filterSecItems(rawSecItems, scope);
  const count = props.type === "dart" ? scopedDartItems.length : scopedSecItems.length;
  const fetchedAt = props.type === "dart" ? dartData?.fetchedAt : secData?.fetchedAt;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const dartItems = paginateItems(scopedDartItems, currentPage);
  const secItems = paginateItems(scopedSecItems, currentPage);

  return (
    <main className={styles.page}>
      <Navigation current={props.type} />
      <ScopeNavigation type={props.type} scope={scope} />

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>{props.type === "dart" ? "KOREA DISCLOSURES" : "U.S. FILINGS"}</p>
          <h1>{props.title}</h1>
          <p className={styles.description}>{props.description}</p>
        </div>
        <div className={styles.statusCard}>
          <strong>{loading ? "불러오는 중" : "실행 중"}</strong>
          <span>새로고침 주기 {REFRESH_MS / 1000}초</span>
          <span>표시 건수 {count}건</span>
          <span>페이지 {currentPage} / {totalPages}</span>
          <span>갱신 시각 {fetchedAt ? formatTime(fetchedAt) : "-"}</span>
        </div>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLabel}>보기 방식</div>
          <div className={styles.segmented}>
            <button
              type="button"
              className={viewMode === "latest" ? styles.segmentActive : styles.segment}
              onClick={() => setViewMode("latest")}
            >
              최신순
            </button>
            <button
              type="button"
              className={viewMode === "grouped" ? styles.segmentActive : styles.segment}
              onClick={() => setViewMode("grouped")}
              disabled={scope !== "all"}
            >
              분류별
            </button>
          </div>
        </div>
        {props.type === "dart" ? (
          dartItems.length > 0 ? (
            viewMode === "latest" ? <DartTable items={dartItems} /> : <DartSections items={dartItems} />
          ) : (
            <p className={styles.empty}>현재 조건에 맞는 DART 공시가 없습니다.</p>
          )
        ) : secItems.length > 0 ? (
          viewMode === "latest" ? <SecTable items={secItems} /> : <SecSections items={secItems} />
        ) : (
          <p className={styles.empty}>현재 조건에 맞는 SEC 공시가 없습니다.</p>
        )}
        {count > PAGE_SIZE ? (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
            >
              이전
            </button>
            <span className={styles.pageInfo}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
