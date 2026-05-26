import { FeatureDisabled } from "@/components/feature-disabled";

export default function UsScannersPage() {
  return (
    <FeatureDisabled
      current="scanners-us"
      category="US Scanners"
      title="실시간 미국 종합 스캐너 기능이 비활성화되었습니다."
      description="미국 주식 6대 스캐너(체결강도, 거래량폭발, 내부자추적 등) 페이지 조회가 중단되었습니다. (상승률 TOP 10 기능은 활성화 상태입니다)"
    />
  );
}
