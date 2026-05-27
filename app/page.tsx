import { PageNavigation } from "@/components/page-navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <PageNavigation current="home" />
      <section className={styles.hero}>
        <p className={styles.kicker}>STOCKMAN QUANT</p>
        <h1>주식 모니터 터미널</h1>
        <p className={styles.description}>
          실시간 DART 공시 조회, 국내주식 체결강도 TOP 10, 미국주식 체결강도 TOP 10 기능이 정상적으로 활성화되어 작동 중입니다.
        </p>
        <div className={styles.actions}>
          <Link href="/dart" className={styles.primary} prefetch={false}>
            DART 공시 분석
          </Link>
          <Link href="/scanners/trading-intensity" className={styles.primary} prefetch={false}>
            국내 체결강도 TOP 10
          </Link>
          <Link href="/scanners/us/intensity" className={styles.primary} prefetch={false}>
            미국 체결강도 TOP 10
          </Link>
        </div>
      </section>
    </main>
  );
}
