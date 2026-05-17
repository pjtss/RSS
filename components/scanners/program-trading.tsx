"use client";

import { useEffect, useState } from "react";
import type { ProgramTradingItem } from "@/lib/kis";
import styles from "./scanner.module.css";
import { GLOBAL_POLLING_INTERVAL } from "@/lib/constants";

export function ProgramTrading() {
  const [items, setItems] = useState<ProgramTradingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/stock/program-trading", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          setItems(data);
          setError(false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    void load();
    const interval = setInterval(load, GLOBAL_POLLING_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <article className={styles.container}>
      <h3 className={styles.title}>
        프로그램 매매 포착
        <span>알고리즘 수급</span>
      </h3>
      
      {loading ? (
        <div className={styles.loading}>불러오는 중...</div>
      ) : error ? (
        <div className={styles.error}>데이터를 불러올 수 없습니다</div>
      ) : (
        <div className={styles.list}>
          {items.slice(0, 5).map((item) => (
            <div key={item.code} className={styles.item}>
              <span className={styles.rank}>{item.rank}</span>
              <div className={styles.info}>
                <span className={styles.name}>{item.company}</span>
                <span className={styles.highlight}>순매수 {item.programNetBuy}</span>
              </div>
              <div className={styles.priceInfo}>
                <span className={styles.price}>{item.price}</span>
                <span className={item.changeRate?.startsWith("+") ? styles.up : styles.down}>
                  {item.changeRate}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
