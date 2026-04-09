import { FeedPage } from "@/components/feed-page";

export default function SecPage() {
  return (
    <FeedPage
      type="sec"
      title="SEC 관심 공시"
      description="SEC Latest Filings Atom 피드에서 관심 폼과 호재 가능 공시만 선별해서 별도 페이지에서 보여줍니다."
    />
  );
}
