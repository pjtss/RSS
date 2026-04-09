"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DartItem, FeedPayload, SecItem } from "@/lib/types";
import styles from "./feed-page.module.css";

const REFRESH_MS = 15000;

type FeedKind = "dart" | "sec";

type FeedPageProps =
  | {
      type: "dart";
      title: string;
      description: string;
    }
  | {
      type: "sec";
      title: string;
      description: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dartData, setDartData] = useState<FeedPayload<DartItem> | null>(null);
  const [secData, setSecData] = useState<FeedPayload<SecItem> | null>(null);

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

    void loadFeed();
    const interval = window.setInterval(() => {
      void loadFeed();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [props.type]);

  const count = props.type === "dart" ? (dartData?.items.length ?? 0) : (secData?.items.length ?? 0);
  const fetchedAt = props.type === "dart" ? dartData?.fetchedAt : secData?.fetchedAt;

  return (
    <main className={styles.page}>
      <Navigation current={props.type} />

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
          <span>갱신 시각 {fetchedAt ? formatTime(fetchedAt) : "-"}</span>
        </div>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.panel}>
        {props.type === "dart" ? (
          dartData && dartData.items.length > 0 ? (
            <DartTable items={dartData.items} />
          ) : (
            <p className={styles.empty}>현재 조건에 맞는 DART 공시가 없습니다.</p>
          )
        ) : secData && secData.items.length > 0 ? (
          <SecTable items={secData.items} />
        ) : (
          <p className={styles.empty}>현재 조건에 맞는 SEC 공시가 없습니다.</p>
        )}
      </section>
    </main>
  );
}
