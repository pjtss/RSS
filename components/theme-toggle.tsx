"use client";

import { useTheme } from "./theme-provider";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={isDark ? "라이트 모드" : "다크 모드"}
      type="button"
    >
      <span className={styles.track}>
        <span className={styles.thumb}>
          {isDark ? "🌙" : "☀️"}
        </span>
      </span>
    </button>
  );
}
