import { FeedPage } from "@/components/feed-page";

export default function SecBullishPage() {
  return (
    <FeedPage
      type="sec"
      scope="bullish"
      title="SEC 금일 호재 공시"
      description="SEC Latest Filings Atom 피드에서 오늘 공시된 항목 중 호재 등급만 서울 시간 기준으로 추려서 최신순으로 보여줍니다."
    />
  );
}
