import { FeedPage } from "@/components/feed-page";

export default function DartPage() {
  return (
    <FeedPage
      type="dart"
      title="DART 금일 공시"
      description="한국 DART RSS에서 오늘 공시된 항목 전체를 서울 시간 기준으로 추려서 최신순으로 보여줍니다."
    />
  );
}
