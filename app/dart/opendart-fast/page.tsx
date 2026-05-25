import { FeatureDisabled } from "@/components/feature-disabled";

export default function DartOpenDartFastPage() {
  return (
    <FeatureDisabled
      current="dart-opendart-fast"
      category="OPEN DART"
      title="실시간 OPEN DART 빠른 공시 기능이 비활성화되었습니다."
      description="현재 OPEN DART 빠른 공시 화면 조회 및 관련 API 호출을 중단한 상태입니다."
    />
  );
}
