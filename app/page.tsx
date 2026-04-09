import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>RSS MONITOR</p>
        <h1>DART와 SEC를 분리한 공시 대시보드</h1>
        <p className={styles.description}>
          원하는 시장을 선택하면 각 페이지에서 최신 RSS 기반 공시를 15초마다 자동 갱신해 보여줍니다.
        </p>
        <div className={styles.actions}>
          <Link href="/dart" className={styles.primary}>
            DART 페이지 보기
          </Link>
          <Link href="/sec" className={styles.secondary}>
            SEC 페이지 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
