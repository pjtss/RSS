import { FeatureDisabled } from "@/components/feature-disabled";

export default function TopRisingPage() {
  return (
    <FeatureDisabled
      current="scanners-us"
      category="US Scanners"
      title="실시간 해외주식 상승률 스캐너 기능이 비활성화되었습니다."
      description="미국 주식 체결강도 TOP 10 기능이 신규 오픈됨에 따라 기존 상승률 TOP 10 페이지는 현재 잠정 중단 상태입니다."
    />
  );
}
