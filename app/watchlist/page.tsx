import { FeatureDisabled } from "@/components/feature-disabled";

export default function WatchlistPage() {
  return (
    <FeatureDisabled
      current="watchlist"
      category="관심 종목"
      title="관심 종목 기능이 비활성화되었습니다."
      description="현재 관심 종목 저장, 조회, 관련 공시 추적 기능을 중단한 상태입니다."
    />
  );
}
