import { FeatureDisabled } from "@/components/feature-disabled";

export default function NotificationsPage() {
  return (
    <FeatureDisabled
      current="notifications"
      category="알림 센터"
      title="알림 센터 기능이 비활성화되었습니다."
      description="현재 알림 이력 조회와 관리 기능을 중단한 상태입니다."
    />
  );
}
