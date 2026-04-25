import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>RSS MONITOR</p>
        <h1>DART와 SEC를 분리한 공시 대시보드</h1>
        <p className={styles.description}>
          시장과 목적에 맞는 화면을 선택하면 최신 RSS 기반 공시를 빠르게 확인할 수 있습니다. 국내 주식은 급속
          호재 페이지에서 더 짧은 주기로 감시할 수 있습니다.
        </p>
        <div className={styles.actions}>
          <Link href="/dart" className={styles.primary}>
            DART 페이지 보기
          </Link>
          <Link href="/dart/rapid" className={styles.primaryAlt}>
            국내 주식 급속 호재
          </Link>
          <Link href="/sec" className={styles.secondary}>
            SEC 페이지 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
