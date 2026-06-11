"use client";

import { useState } from "react";
import styles from "@/app/admin/page.module.css";

type Result = {
  ok: boolean;
  status: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
  };
  response: {
    rawText: string;
    parsed: unknown;
  };
};

export function AdminKisTest() {
  const [excd, setExcd] = useState("NAS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function runTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/kis-us-test?excd=${encodeURIComponent(excd)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "KIS 테스트 호출에 실패했습니다.");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ADMIN KIS TEST</p>
            <h1 className={styles.title}>미국 상승률 TOP N API 테스트</h1>
            <p className={styles.subtitle}>
              관리자 세션으로 KIS 해외주식 상승률 API를 직접 호출해 요청 정보와 원문 응답을 확인합니다.
            </p>
          </div>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>호출 설정</h2>
              <p className={styles.cardDesc}>EXCD만 선택해서 현재 KIS 실시간 응답을 바로 확인합니다.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <label style={{ display: "grid", gap: 8, minWidth: 200 }}>
              <span style={{ color: "#cbd5e1", fontWeight: 700 }}>EXCD</span>
              <select
                value={excd}
                onChange={(e) => setExcd(e.target.value)}
                style={{
                  minHeight: 48,
                  borderRadius: 12,
                  padding: "0 14px",
                  border: "1px solid rgba(148, 163, 184, 0.22)",
                  background: "rgba(15, 23, 42, 0.88)",
                  color: "#f8fafc",
                }}
              >
                <option value="NAS">NASDAQ</option>
                <option value="NYS">NYSE</option>
                <option value="AMS">AMEX</option>
              </select>
            </label>
            <div style={{ alignSelf: "end" }}>
              <button className={styles.toggleButton} onClick={() => void runTest()} disabled={loading}>
                {loading ? "호출 중..." : "KIS 요청 실행"}
              </button>
            </div>
          </div>
        </section>

        {error && <div className={`${styles.alert} ${styles.error}`}>{error}</div>}

        {result && (
          <section className={styles.card} style={{ display: "grid", gap: 12 }}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>응답 결과</h2>
                <p className={styles.cardDesc}>
                  상태 코드와 원문 텍스트를 그대로 표시합니다.
                </p>
              </div>
              <span className={`${styles.state} ${result.ok ? styles.on : styles.off}`}>
                {result.status}
              </span>
            </div>

            <pre style={{
              margin: 0,
              padding: 16,
              borderRadius: 12,
              overflowX: "auto",
              background: "rgba(2, 6, 23, 0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e2e8f0",
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
{JSON.stringify(result, null, 2)}
            </pre>
          </section>
        )}
      </section>
    </main>
  );
}

