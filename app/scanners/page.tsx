import { PageNavigation } from "@/components/page-navigation";
import { TradingIntensity } from "@/components/trading-intensity";
import { VolumeSpike } from "@/components/scanners/volume-spike";
import { NetBuying } from "@/components/scanners/net-buying";
import { ProgramTrading } from "@/components/scanners/program-trading";
import { NewHigh } from "@/components/scanners/new-high";
import { BidAskRatio } from "@/components/scanners/bid-ask-ratio";
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
        <VolumeSpike />
        <NetBuying />
        <ProgramTrading />
        <NewHigh />
        <BidAskRatio />
      </div>
    </main>
  );
}
