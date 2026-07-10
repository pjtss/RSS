"use client";

import { useState } from "react";
import styles from "@/app/admin/page.module.css";

type AdminSecApiRunnerProps = {
  loggedIn: boolean;
};

type SecTestResult = {
  ok?: boolean;
  status?: number;
  request?: {
    method?: string;
    url?: string;
    originalUrl?: string;
  };
  urlInfo?: {
    canonicalUrl?: string;
    cik?: string;
    accessionNumber?: string;
    accessionCompact?: string;
    documentFile?: string;
    directoryUrl?: string;
  };
  document?: {
    aiTextLength?: number;
    promptText?: string;
    metadata?: {
      documentType?: string;
      registrantName?: string;
      tradingSymbol?: string;
      reportDate?: string;
      accessionNumber?: string;
    };
    events?: Array<{
      type?: string;
      item?: string;
      title?: string;
      text?: string;
    }>;
  };
  aiEvaluation?: {
    skipped?: boolean;
    reason?: string;
    model?: string;
    evaluation?: {
      level?: string;
      fundamentalScore?: number | null;
      catalystScore?: number | null;
      shortTermImpactScore?: number | null;
      longTermImpactScore?: number | null;
      confidence?: number | null;
      noveltyScore?: number | null;
      surpriseScore?: number | null;
      alreadyPricedInRisk?: number | null;
      materialityScore?: number | null;
      summary?: string;
      facts?: string[];
      inferences?: string[];
      unknowns?: string[];
      eventRisks?: string[];
      analysisLimitations?: string[];
      marketImpact?: string;
      requiresMarketData?: boolean;
      recommendedNextChecks?: string[];
      timeHorizon?: {
        immediate?: string;
        shortTerm?: string;
        longTerm?: string;
      };
    };
  };
};

const DEFAULT_SEC_URL =
  "https://www.sec.gov/Archives/edgar/data/1730168/000119312526295589/d84378d8k.htm?utm_source=chatgpt.com";

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "로그인에 실패했습니다.");
      }
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.loginShell}>
      <section className={styles.loginCard}>
        <p className={styles.loginKicker}>ADMIN ACCESS</p>
        <h1 className={styles.loginTitle}>SEC API 테스트 로그인</h1>
        <form onSubmit={login} className={styles.loginForm}>
          <input
            className={styles.passwordInput}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
          />
          <button className={styles.submitButton} type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
          {error && <p className={`${styles.alert} ${styles.error}`}>{error}</p>}
        </form>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(148, 163, 184, 0.14)",
        background: "rgba(2, 6, 23, 0.28)",
      }}
    >
      <p style={{ margin: 0, color: "#94a3b8", fontSize: 12, fontWeight: 800 }}>{label}</p>
      <p style={{ margin: "6px 0 0", color: "#f8fafc", fontWeight: 800, overflowWrap: "anywhere" }}>
        {value ?? "-"}
      </p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: 14,
        borderRadius: 12,
        border: "1px solid rgba(148, 163, 184, 0.14)",
        background: "rgba(2, 6, 23, 0.28)",
      }}
    >
      <h3 style={{ margin: 0, color: "#f8fafc", fontSize: 16, fontWeight: 900 }}>{title}</h3>
      {items && items.length > 0 ? (
        <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: "#cbd5e1", lineHeight: 1.7 }}>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: "10px 0 0", color: "#94a3b8", lineHeight: 1.5 }}>표시할 항목이 없습니다.</p>
      )}
    </div>
  );
}

export function AdminSecApiRunner({ loggedIn: initialLoggedIn }: AdminSecApiRunnerProps) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [secUrl, setSecUrl] = useState(DEFAULT_SEC_URL);
  const [loading, setLoading] = useState(false);
  const [sendingDiscord, setSendingDiscord] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<SecTestResult | null>(null);

  async function runSecTest() {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/sec-raw-test?url=${encodeURIComponent(secUrl)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "SEC API 호출에 실패했습니다.");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function buildDiscordResultPayload(source: SecTestResult) {
    return {
      request: source.request,
      urlInfo: source.urlInfo,
      document: {
        metadata: source.document?.metadata,
        events: source.document?.events,
      },
      aiEvaluation: source.aiEvaluation,
    };
  }

  async function sendDiscord() {
    if (!result) return;
    setSendingDiscord(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/sec-discord", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ result: buildDiscordResultPayload(result) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Discord 전송에 실패했습니다.");
      }
      setNotice("Discord 전송이 완료됐습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSendingDiscord(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
    setResult(null);
  }

  if (!loggedIn) {
    return <LoginForm onLoggedIn={() => setLoggedIn(true)} />;
  }

  const metadata = result?.document?.metadata;
  const evaluation = result?.aiEvaluation?.evaluation;

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>SEC API RUNNER</p>
            <h1 className={styles.title}>SEC 공시 분석 테스트</h1>
            <p className={styles.subtitle}>
              SEC 원문 URL을 입력하면 Next.js API가 URL 정규화, 원문 다운로드, 이벤트 파싱, AI 평가까지 실행하고 결과를 화면에 표시합니다.
            </p>
          </div>
          <div className={styles.actions}>
            <a href="/admin" className={styles.secondaryLink}>
              대시보드
            </a>
            <a href="/admin/api-tests" className={styles.secondaryLink}>
              API 테스트
            </a>
            <button className={styles.logoutButton} onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>

        {error && <div className={`${styles.alert} ${styles.error}`}>{error}</div>}
        {notice && <div className={`${styles.alert} ${styles.on}`}>{notice}</div>}

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>SEC 원문 URL</h2>
              <p className={styles.cardDesc}>공식 SEC Archives HTML URL만 허용됩니다.</p>
            </div>
            <span className={`${styles.state} ${loading ? styles.on : styles.off}`}>{loading ? "실행 중" : "대기"}</span>
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <input
              value={secUrl}
              onChange={(e) => setSecUrl(e.target.value)}
              placeholder="https://www.sec.gov/Archives/edgar/data/..."
              style={{
                minHeight: 52,
                borderRadius: 12,
                padding: "0 14px",
                border: "1px solid rgba(148, 163, 184, 0.22)",
                background: "rgba(15, 23, 42, 0.88)",
                color: "#f8fafc",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className={styles.toggleButton} onClick={() => void runSecTest()} disabled={loading || !secUrl.trim()}>
                {loading ? "분석 중..." : "SEC API 실행"}
              </button>
              <button className={styles.toggleButton} onClick={() => void sendDiscord()} disabled={!result || loading || sendingDiscord}>
                {sendingDiscord ? "Discord 전송 중..." : "Discord로 결과 전송"}
              </button>
              <button className={styles.logoutButton} onClick={() => setSecUrl(DEFAULT_SEC_URL)} disabled={loading}>
                Broadcom 예시 입력
              </button>
            </div>
          </div>
        </section>

        {result && (
          <>
            <section className={styles.statusGrid}>
              <Field label="HTTP Status" value={result.status} />
              <Field label="Original URL" value={result.request?.originalUrl} />
              <Field label="Canonical URL" value={result.urlInfo?.canonicalUrl} />
              <Field label="CIK" value={result.urlInfo?.cik} />
              <Field label="Accession" value={result.urlInfo?.accessionNumber} />
              <Field label="Document File" value={result.urlInfo?.documentFile} />
            </section>

            <section className={styles.statusGrid}>
              <Field label="Company" value={metadata?.registrantName} />
              <Field label="Ticker" value={metadata?.tradingSymbol} />
              <Field label="Form" value={metadata?.documentType} />
              <Field label="Report Date" value={metadata?.reportDate} />
              <Field label="AI Text Length" value={result.document?.aiTextLength} />
              <Field label="AI Model" value={result.aiEvaluation?.model || (result.aiEvaluation?.skipped ? "skipped" : "-")} />
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Parsed Events</h2>
                  <p className={styles.cardDesc}>Parser Router가 생성한 공통 이벤트 구조입니다.</p>
                </div>
                <span className={`${styles.state} ${result.document?.events?.length ? styles.on : styles.off}`}>
                  {result.document?.events?.length || 0}
                </span>
              </div>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {(result.document?.events || []).map((event, index) => (
                  <article
                    key={`${event.type}-${index}`}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: "1px solid rgba(148, 163, 184, 0.14)",
                      background: "rgba(2, 6, 23, 0.28)",
                    }}
                  >
                    <div className={styles.cardHeader}>
                      <div>
                        <h3 className={styles.cardTitle}>{event.title || `Event ${index + 1}`}</h3>
                        <p className={styles.cardDesc}>
                          {event.type} {event.item ? `| Item ${event.item}` : ""}
                        </p>
                      </div>
                    </div>
                    <p style={{ margin: "12px 0 0", color: "#e2e8f0", lineHeight: 1.7 }}>{event.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>AI Evaluation</h2>
                  <p className={styles.cardDesc}>
                    {result.aiEvaluation?.skipped
                      ? result.aiEvaluation.reason || "AI 평가가 건너뛰어졌습니다."
                      : evaluation?.summary || "AI 평가 요약입니다."}
                  </p>
                </div>
                <span className={`${styles.state} ${result.aiEvaluation?.skipped ? styles.off : styles.on}`}>
                  {result.aiEvaluation?.skipped ? "skipped" : evaluation?.level || "-"}
                </span>
              </div>

              {evaluation && (
                <>
                  <div className={styles.statusGrid} style={{ marginTop: 16 }}>
                    <Field label="Fundamental" value={evaluation.fundamentalScore} />
                    <Field label="Catalyst" value={evaluation.catalystScore} />
                    <Field label="Short Term" value={evaluation.shortTermImpactScore} />
                    <Field label="Long Term" value={evaluation.longTermImpactScore} />
                    <Field label="Confidence" value={evaluation.confidence} />
                    <Field label="Requires Market Data" value={String(evaluation.requiresMarketData)} />
                  </div>
                  <div className={styles.statusGrid} style={{ marginTop: 14 }}>
                    <ListBlock title="Facts" items={evaluation.facts} />
                    <ListBlock title="Inferences" items={evaluation.inferences} />
                    <ListBlock title="Unknowns" items={evaluation.unknowns} />
                  </div>
                  <div className={styles.statusGrid} style={{ marginTop: 14 }}>
                    <ListBlock title="Event Risks" items={evaluation.eventRisks} />
                    <ListBlock title="Analysis Limitations" items={evaluation.analysisLimitations} />
                    <ListBlock title="Recommended Next Checks" items={evaluation.recommendedNextChecks} />
                  </div>
                </>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Prompt Text</h2>
              <pre
                style={{
                  margin: "14px 0 0",
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
                  maxHeight: 320,
                }}
              >
                {result.document?.promptText || ""}
              </pre>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Raw API Result</h2>
              <pre
                style={{
                  margin: "14px 0 0",
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
                  maxHeight: 520,
                }}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
