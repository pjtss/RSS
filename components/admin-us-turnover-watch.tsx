"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageShell } from "@/components/admin-page-shell";
import styles from "@/app/admin/page.module.css";

type Watch = { ticker: string; threshold: number; lastMarket?: string | null; lastRatio?: number | null; lastCheckedAt?: string | null; lastAlertedAt?: string | null; lastError?: string | null };

export function AdminUsTurnoverWatch() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [ticker, setTicker] = useState("");
  const [threshold, setThreshold] = useState("1");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/us-turnover-watch", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "감시 종목을 불러오지 못했습니다.");
    setWatches(data.watches || []);
  }

  useEffect(() => { void load().catch((e) => setError(e instanceof Error ? e.message : String(e))); }, []);

  async function add() {
    setError(null);
    const response = await fetch("/api/admin/us-turnover-watch", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker, threshold }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "감시 종목을 저장하지 못했습니다."); return; }
    setWatches(data.watches || []); setTicker("");
  }

  async function remove(value: string) {
    const response = await fetch("/api/admin/us-turnover-watch", {
      method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticker: value }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "감시 종목을 삭제하지 못했습니다."); return; }
    setWatches(data.watches || []);
  }

  return <AdminPageShell eyebrow="TURNOVER WATCH" title="특정 종목 거래대금 감시" description="등록한 티커를 NAS·AMS·NYS에서 1분마다 조회하고, 기준 비율 이상이면 하루 한 번 Discord로 알립니다.">
    {error && <div className={`${styles.alert} ${styles.error}`}>{error}</div>}
    <section className={styles.card}>
      <div className={styles.cardActions}>
        <input className={styles.textInput} value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="티커: BNRG" />
        <input className={styles.textInput} type="number" min="0" step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="기준 비율 %" />
        <button className={styles.toggleButton} onClick={() => void add()} disabled={!ticker.trim()}><Plus size={16} />저장</button>
      </div>
    </section>
    <section className={styles.statusGrid}>
      {watches.map((watch) => <article key={watch.ticker} className={styles.card}><div className={styles.cardHeader}><div><strong className={styles.cardTitle}>{watch.ticker}</strong><p className={styles.cardDesc}>기준 {Number(watch.threshold).toFixed(2)}% · 최근 {watch.lastRatio == null ? "-" : `${Number(watch.lastRatio).toFixed(2)}%`} · {watch.lastMarket || "-"}</p><p className={styles.cardDesc}>{watch.lastError || (watch.lastCheckedAt ? `조회 ${new Date(watch.lastCheckedAt).toLocaleString("ko-KR")}` : "아직 조회되지 않음")}</p></div><button className={styles.logoutButton} onClick={() => void remove(watch.ticker)} aria-label={`${watch.ticker} 삭제`}><Trash2 size={16} /></button></div></article>)}
      {watches.length === 0 && <div className={styles.emptyState}>등록된 감시 종목이 없습니다.</div>}
    </section>
  </AdminPageShell>;
}
