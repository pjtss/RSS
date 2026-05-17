import Link from "next/link";
import styles from "./page-navigation.module.css";

type PageKey = "home" | "dart" | "dart-opendart-fast" | "sec" | "scanners";

export function PageNavigation({ current }: { current: PageKey }) {
  return (
    <nav className={styles.nav}>
      <Link className={current === "home" ? styles.navActive : styles.navLink} href="/">
        홈
      </Link>
      <Link className={current === "dart" ? styles.navActive : styles.navLink} href="/dart">
        DART
      </Link>
      <Link
        className={current === "dart-opendart-fast" ? styles.navActive : styles.navLink}
        href="/dart/opendart-fast"
      >
        OPEN DART
      </Link>
      <Link className={current === "sec" ? styles.navActive : styles.navLink} href="/sec">
        SEC
      </Link>
      <Link className={current === "scanners" ? styles.navActive : styles.navLink} href="/scanners">
        마켓 스캐너
      </Link>
    </nav>
  );
}
