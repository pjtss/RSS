"use client";

import { PageNavigation } from "@/components/page-navigation";
import { usePushDebug } from "@/components/push-provider";
import { useState } from "react";
import styles from "@/components/feed-page.module.css"; // Reuse existing styles for now

export default function NotificationsPage() {
  const [error, setError] = useState<string | null>(null);
  const [pushTesting, setPushTesting] = useState(false);
  const { status: pushStatus, enablePush, updatePreferences, refreshStatus, enabling, saving } = usePushDebug();

  async function handleEnablePush() {
    try {
      await enablePush();
      await refreshStatus();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림 활성화 실패");
    }
  }

  async function handleToggleAll() {
    try {
      if (!pushStatus?.subscriptionExists) {
        await handleEnablePush();
        return;
      }

      const enabled = !(pushStatus.enabled ?? true);
      await updatePreferences({
        enabled,
        dartEnabled: enabled ? (pushStatus.dartEnabled ?? true) : false,
        intensityEnabled: enabled ? (pushStatus.intensityEnabled ?? true) : false,
        risingEnabled: enabled ? (pushStatus.risingEnabled ?? true) : false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "푸시 설정 변경 실패");
    }
  }

  async function handleToggleSource(source: "dart" | "intensity" | "rising") {
    try {
      if (!pushStatus?.subscriptionExists) {
        await handleEnablePush();
        return;
      }

      const nextState = {
        enabled: true,
        dartEnabled: pushStatus.dartEnabled ?? true,
        intensityEnabled: pushStatus.intensityEnabled ?? true,
        risingEnabled: pushStatus.risingEnabled ?? true,
      };

      if (source === "dart") {
        nextState.dartEnabled = !(pushStatus.dartEnabled ?? true);
      } else if (source === "intensity") {
        nextState.intensityEnabled = !(pushStatus.intensityEnabled ?? true);
      } else if (source === "rising") {
        nextState.risingEnabled = !(pushStatus.risingEnabled ?? true);
      }

      await updatePreferences(nextState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "푸시 설정 변경 실패");
    }
  }

  async function handleTestPush() {
    try {
      setPushTesting(true);
      const response = await fetch("/api/push/test", { method: "POST" });
      if (!response.ok) throw new Error("테스트 푸시 전송 실패");
    } catch (err) {
      setError(err instanceof Error ? err.message : "테스트 푸시 전송 실패");
    } finally {
      setPushTesting(false);
    }
  }

  return (
    <main className={styles.page}>
      <PageNavigation current="notifications" />

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>NOTIFICATION SETTINGS</p>
          <div className={styles.heroMain}>
            <p className={styles.heroDescription}>스마트폰 또는 PC로 최강호재 및 신규 스캐너 진입 알림을 실시간으로 수신합니다.</p>
            <h1 className={styles.heroTitle}>알림 환경설정</h1>
          </div>
        </div>
        <div className={styles.statusCard}>
          <div className={styles.pushDebug}>
            <span>푸시 지원: {pushStatus?.supported ? "예" : "아니오"}</span>
            <span>권한: {pushStatus?.permission ?? "-"}</span>
            <span>현재 기기 구독 존재: {pushStatus?.subscriptionExists ? "예" : "아니오"}</span>
            <span>현재 기기 DB 저장: {pushStatus?.currentDeviceSaved ? "예" : "아니오"}</span>
            <hr style={{ margin: "8px 0", borderColor: "var(--border)" }} />
            <span>전체 푸시: {pushStatus?.enabled === false ? "꺼짐" : "켜짐"}</span>
            <span>DART 공시 푸시: {pushStatus?.dartEnabled === false ? "꺼짐" : "켜짐"}</span>
            <span>국내 체결강도 푸시: {pushStatus?.intensityEnabled === false ? "꺼짐" : "켜짐"}</span>
            <span>미국 상승률 푸시: {pushStatus?.risingEnabled === false ? "꺼짐" : "켜짐"}</span>
            <hr style={{ margin: "8px 0", borderColor: "var(--border)" }} />
            <span>최근 User-Agent: {pushStatus?.latestUserAgent ?? "-"}</span>
            {pushStatus?.error ? <span style={{ color: "red" }}>오류: {pushStatus.error}</span> : null}
            {error ? <span style={{ color: "red" }}>오류: {error}</span> : null}
          </div>

          <button
            type="button"
            className={styles.enableButton}
            onClick={handleEnablePush}
            disabled={enabling || !pushStatus?.supported}
          >
            {enabling ? "알림 활성화 중.." : "알림 권한/구독 활성화 (최초 1회 필수)"}
          </button>

          <div className={styles.toggleRow}>
            <button type="button" className={styles.toggleButton} onClick={handleToggleAll} disabled={saving}>
              {pushStatus?.enabled === false ? "✅ 전체 푸시 켜기" : "전체 푸시 끄기"}
            </button>
            <button type="button" className={styles.toggleButton} onClick={() => handleToggleSource("dart")} disabled={saving}>
              {pushStatus?.dartEnabled === false ? "🔔 DART 공시 켜기" : "🔕 DART 공시 끄기"}
            </button>
            <button type="button" className={styles.toggleButton} onClick={() => handleToggleSource("intensity")} disabled={saving}>
              {pushStatus?.intensityEnabled === false ? "🔔 국내 체결강도 켜기" : "🔕 국내 체결강도 끄기"}
            </button>
            <button type="button" className={styles.toggleButton} onClick={() => handleToggleSource("rising")} disabled={saving}>
              {pushStatus?.risingEnabled === false ? "🔔 미국 상승률 켜기" : "🔕 미국 상승률 끄기"}
            </button>
          </div>

          <button type="button" className={styles.testButton} onClick={handleTestPush} disabled={pushTesting}>
            {pushTesting ? "전송 중.." : "테스트 푸시 보내기"}
          </button>
        </div>
      </section>
    </main>
  );
}
