import { FeedPage } from "@/components/feed-page";

export default function SecBearishPage() {
  return (
    <FeedPage
      type="sec"
      scope="bearish"
      title="SEC 금일 악재 공시"
      description="SEC Latest Filings Atom 피드에서 오늘 공시된 항목 중 악재 등급만 서울 시간 기준으로 추려서 최신순으로 보여줍니다."
    />
  );
}
