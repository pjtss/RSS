import { PageNavigation } from "@/components/page-navigation";
import { UsTradingIntensity } from "@/components/scanners/us/trading-intensity";
import { UsVolumeSpike } from "@/components/scanners/us/volume-spike";
import { UsNetBuying } from "@/components/scanners/us/net-buying";
import { UsProgramTrading } from "@/components/scanners/us/program-trading";
import { UsNewHigh } from "@/components/scanners/us/new-high";
import { UsBidAskRatio } from "@/components/scanners/us/bid-ask-ratio";
import styles from "../page.module.css";

export default function UsScannersPage() {
  return (
    <main className={styles.page}>
      <PageNavigation current="scanners-us" />
      
      <header className={styles.hero}>
        <p className={styles.kicker}>REAL-TIME US MARKET SCANNERS</p>
        <h1 className={styles.title}>미국 종합 시장 스캐너</h1>
      </header>

      <div className={styles.grid}>
        <UsTradingIntensity />
        <UsVolumeSpike />
        <UsNetBuying />
        <UsProgramTrading />
        <UsNewHigh />
        <UsBidAskRatio />
      </div>
    </main>
  );
}
