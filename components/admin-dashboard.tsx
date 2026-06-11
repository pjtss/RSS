"use client";

import { useEffect, useState } from "react";

type FeatureKey = "dart_realtime" | "sec_realtime" | "us_scanners";

type FeatureInfo = { key: FeatureKey; label: string; description: string };

export function AdminDashboard({ loggedIn }: { loggedIn: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flags, setFlags] = useState<Record<FeatureKey, boolean> | null>(null);
  const [features, setFeatures] = useState<FeatureInfo[]>([]);

  async function loadFlags() {
    const res = await fetch("/api/admin/flags", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("관리자 플래그를 불러오지 못했습니다.");
    }
    const data = await res.json();
    setFlags(data.flags);
    setFeatures(data.features);
  }

  useEffect(() => {
    if (loggedIn) {
      void loadFlags().catch((err) => setError(err instanceof Error ? err.message : String(err)));
    }
  }, [loggedIn]);

  async function handleLogin(e: React.FormEvent) {
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
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(key: FeatureKey, enabled: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/flags", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, enabled }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "플래그 저장에 실패했습니다.");
      }
      const data = await res.json();
      setFlags(data.flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  if (!loggedIn) {
    return (
      <main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
        <h1>관리자 로그인</h1>
        <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
            style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <button type="submit" disabled={loading} style={{ padding: 12 }}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
          {error && <p style={{ color: "crimson" }}>{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1>관리자 대시보드</h1>
        <button onClick={handleLogout} style={{ padding: "10px 14px" }}>로그아웃</button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <section style={{ display: "grid", gap: 12, marginTop: 20 }}>
        {features.map((feature) => {
          const enabled = flags?.[feature.key] ?? false;
          return (
            <div key={feature.key} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <h2 style={{ margin: 0 }}>{feature.label}</h2>
                  <p style={{ margin: "6px 0 0", color: "#666" }}>{feature.description}</p>
                </div>
                <button
                  onClick={() => void handleToggle(feature.key, !enabled)}
                  disabled={loading}
                  style={{ padding: "10px 14px", minWidth: 120 }}
                >
                  {enabled ? "끄기" : "켜기"}
                </button>
              </div>
              <p style={{ margin: "10px 0 0", fontWeight: 600 }}>
                상태: {enabled ? "켜짐" : "꺼짐"}
              </p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
