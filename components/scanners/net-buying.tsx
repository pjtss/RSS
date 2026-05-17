"use client";

import { useEffect, useState } from "react";
import type { NetBuyingItem } from "@/lib/kis";
import styles from "./scanner.module.css";
import { GLOBAL_POLLING_INTERVAL } from "@/lib/constants";

export function NetBuying() {
  const [items, setItems] = useState<NetBuyingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/stock/net-buying", { cache: "no-store" });
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
        외인/기관 순매수 추적
        <span>실시간 잠정치</span>
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
                <span className={styles.highlight}>외인 {item.foreignNetBuy} | 기관 {item.instNetBuy}</span>
              </div>
              <div className={styles.priceInfo}>
                <span className={styles.price}>{item.price}</span>
                <span className={item.changeRate.startsWith("+") ? styles.up : styles.down}>
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
