import { PageNavigation } from "@/components/page-navigation";
import { TradingIntensity } from "@/components/trading-intensity";
import styles from "./page.module.css";

export default function ScannersPage() {
  return (
    <main className={styles.page}>
      <PageNavigation current="scanners" />
      
      <header className={styles.hero}>
        <p className={styles.kicker}>REAL-TIME MARKET SCANNERS</p>
        <h1 className={styles.title}>종합 시장 스캐너</h1>
      </header>

      <div className={styles.grid}>
        <TradingIntensity />
      </div>
    </main>
  );
}
