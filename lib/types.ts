export type DartJudgment = "최강호재" | "호재가능" | "악재" | "중립";
export type SecSentiment = "호재가능" | "악재가능" | "중요공시" | "일반공시";

export interface AlertItem {
  source: "DART" | "SEC";
  externalId: string;
  level: string;
  company: string;
  title: string;
  link: string;
  publishedAt: string;
}

export interface DartItem {
  source: "DART";
  company: string;
  title: string;
  judgment: DartJudgment;
  keywords: string[];
  publishedAt: string;
  link: string;
}

export interface SecItem {
  source: "SEC";
  accession: string;
  company: string;
  formType: string;
  sentiment: SecSentiment;
  publishedAt: string;
  title: string;
  summary: string;
  link: string;
}

export interface FeedPayload<T> {
  source: "DART" | "SEC";
  fetchedAt: string;
  items: T[];
  newAlerts?: AlertItem[];
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}
