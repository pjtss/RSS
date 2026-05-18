"use client";

import { useState, useEffect } from "react";
import {
  getStockAlerts,
  addStockAlert,
  removeStockAlert,
  toggleSuperOnly,
  type StockAlertConfig,
} from "@/lib/stock-alerts";
import styles from "./stock-alert-manager.module.css";

export function StockAlertManager() {
  const [alerts, setAlerts] = useState<StockAlertConfig[]>([]);
  const [input, setInput] = useState("");
  const [superOnly, setSuperOnly] = useState(false);

  useEffect(() => {
    setAlerts(getStockAlerts());
  }, []);

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setAlerts(addStockAlert(trimmed, superOnly));
    setInput("");
    setSuperOnly(false);
  }

  function handleRemove(company: string) {
    setAlerts(removeStockAlert(company));
  }

  function handleToggleSuperOnly(company: string) {
    setAlerts(toggleSuperOnly(company));
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>🔔</span>
        <h3 className={styles.title}>종목별 알림 구독</h3>
        <span className={styles.badge}>{alerts.length}</span>
      </div>

      <p className={styles.desc}>
        관심 종목을 등록하면 해당 종목 공시 발생 시 우선 알림을 받습니다.
      </p>

      {/* 입력 폼 */}
      <div className={styles.form}>
        <input
          id="stock-alert-input"
          className={styles.input}
          type="text"
          placeholder="종목명 입력 (예: 삼성전자)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={superOnly}
            onChange={(e) => setSuperOnly(e.target.checked)}
          />
          <span>최강호재만</span>
        </label>
        <button id="stock-alert-add-btn" className={styles.addBtn} onClick={handleAdd}>
          + 추가
        </button>
      </div>

      {/* 구독 목록 */}
      {alerts.length === 0 ? (
        <p className={styles.empty}>구독 중인 종목이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {alerts.map((cfg) => (
            <li key={cfg.company} className={styles.listItem}>
              <span className={styles.companyName}>{cfg.company}</span>
              <button
                className={`${styles.levelToggle} ${cfg.superOnly ? styles.superOnly : styles.allLevel}`}
                onClick={() => handleToggleSuperOnly(cfg.company)}
                title="클릭하면 필터 수준 변경"
              >
                {cfg.superOnly ? "🚨 최강호재만" : "⚡ 전체 호재"}
              </button>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(cfg.company)}
                aria-label={`${cfg.company} 알림 구독 해제`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
