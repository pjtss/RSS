import { XMLParser } from "fast-xml-parser";
import type { DartItem, DartJudgment, FeedPayload, SecItem, SecSentiment } from "@/lib/types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  processEntities: false,
  htmlEntities: false,
});

const DART_URL = "https://dart.fss.or.kr/api/todayRSS.xml";
const SEC_URL =
  "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&company=&count=100&dateb=&output=atom&owner=include&start=0";
const SEC_USER_AGENT = "MySecWatcher/1.0 your_email@example.com";

const DART_IMPORTANT_KEYWORDS = [
  "단일판매",
  "공급계약",
  "영업이익",
  "매출액",
  "잠정",
  "자기주식",
  "자사주",
  "합병",
  "분할",
  "최대주주",
  "투자판단관련",
  "영업정지",
  "유상증자",
  "전환사채",
  "무상증자",
  "조회공시",
  "불성실",
  "소송",
  "회생",
  "특허",
  "계약",
  "수주",
];

const DART_NEGATIVE_KEYWORDS = [
  "유상증자",
  "전환사채",
  "신주인수권부사채",
  "교환사채",
  "감자",
  "소송",
  "피소",
  "회생",
  "파산",
  "영업정지",
  "불성실",
  "불성실공시",
  "관리종목",
  "상장적격성",
  "투자주의",
  "투자경고",
  "투자위험",
  "단기과열",
  "최대주주변경",
  "최대주주 변경",
  "지분변동",
  "주식등의대량보유상황보고서",
  "해지",
  "철회",
  "정정",
  "조회공시",
  "조회공시요구",
  "반기보고서",
  "분기보고서",
  "사업보고서",
  "감사보고서",
  "주주총회",
  "주주총회소집",
  "참고사항",
  "안내공시",
];

const DART_STRONG_POSITIVE_KEYWORDS = [
  "단일판매ㆍ공급계약체결",
  "단일판매·공급계약체결",
  "단일판매공급계약체결",
  "공급계약체결",
  "단일판매계약체결",
  "대규모수주",
  "수주",
  "특허권취득",
  "특허 취득",
  "자기주식취득",
  "자기주식 취득",
  "자사주 취득",
  "무상증자",
  "현금ㆍ현물배당결정",
  "현금·현물배당결정",
  "배당결정",
  "흑자전환",
  "영업이익 증가",
  "매출액 증가",
  "당기순이익 증가",
  "대규모 공급계약",
  "계약체결",
];

const DART_WEAK_POSITIVE_KEYWORDS = [
  "투자판단관련 주요경영사항",
  "투자판단관련주요경영사항",
  "잠정실적",
  "영업이익",
  "매출액",
];

const SEC_POSITIVE_KEYWORDS = [
  "ENTRY INTO A MATERIAL DEFINITIVE AGREEMENT",
  "RESULTS OF OPERATIONS",
  "EARNINGS",
  "DIVIDEND",
  "REPURCHASE",
  "COMPLETION OF ACQUISITION",
  "MATERIAL AGREEMENT",
];

const SEC_NEGATIVE_KEYWORDS = [
  "BANKRUPTCY",
  "GOING CONCERN",
  "DEFAULT",
  "DELIST",
  "OFFERING",
  "DILUTION",
  "TERMINATION",
];

const SEC_TARGET_FORMS = new Set([
  "8-K",
  "10-K",
  "10-Q",
  "6-K",
  "S-1",
  "424B3",
  "SC 13D",
  "SC 13G",
]);

function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function stripCdata(value: string | undefined): string {
  return (value ?? "")
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function normalizeText(value: unknown): string {
  if (typeof value === "string") {
    return stripCdata(value);
  }
  if (value && typeof value === "object" && "#text" in value) {
    return stripCdata(String(value["#text"]));
  }
  return "";
}

function extractDartCompany(title: string): string {
  const cleaned = title.trim().replace(/^\s*(\([^)]+\)|\[[^\]]+\])\s*/, "");
  const hyphenMatch = cleaned.match(/^\s*([^-]{1,40}?)\s*-\s*/);
  if (hyphenMatch) {
    return hyphenMatch[1].trim();
  }

  const fallbackMatch = cleaned.match(/^\s*([^\(\)\[\]:]{2,40})/);
  if (fallbackMatch) {
    return fallbackMatch[1].trim();
  }

  return "종목명미확인";
}

function classifyDartTitle(title: string): DartJudgment {
  const normalized = title.trim();

  if (DART_NEGATIVE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "악재";
  }
  if (DART_STRONG_POSITIVE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "최강호재";
  }
  if (DART_WEAK_POSITIVE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "호재가능";
  }
  return "중립";
}

function extractDartKeywords(title: string): string[] {
  return DART_IMPORTANT_KEYWORDS.filter((keyword) => title.includes(keyword));
}

type DartRawItem = {
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
};

export async function fetchDartFeed(): Promise<FeedPayload<DartItem>> {
  const response = await fetch(DART_URL, {
    cache: "no-store",
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
    },
  });

  if (!response.ok) {
    throw new Error(`DART RSS 요청 실패: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const items = ensureArray<DartRawItem>(parsed?.rss?.channel?.item)
    .map((item) => {
      const title = normalizeText(item.title);
      const judgment = classifyDartTitle(title);
      if (!["최강호재", "호재가능", "악재"].includes(judgment)) {
        return null;
      }

      return {
        source: "DART" as const,
        company: extractDartCompany(title),
        title,
        judgment,
        keywords: extractDartKeywords(title),
        publishedAt: normalizeText(item.pubDate),
        link: normalizeText(item.link),
      };
    })
    .filter((item): item is DartItem => item !== null);

  return {
    source: "DART",
    fetchedAt: new Date().toISOString(),
    items,
  };
}

function normalizeSecFormType(formType: string): string {
  const value = formType.toUpperCase().trim();
  if (value === "424B3") {
    return "424B3";
  }
  if (value === "13D" || value === "SC 13D") {
    return "SC 13D";
  }
  if (value === "13G" || value === "SC 13G") {
    return "SC 13G";
  }
  return value;
}

type SecTag = {
  term?: string;
};

type SecRawEntry = {
  id?: unknown;
  title?: unknown;
  summary?: unknown;
  link?: { href?: string } | Array<{ href?: string }>;
  published?: unknown;
  updated?: unknown;
  category?: SecTag | SecTag[];
};

function extractSecFormType(entry: SecRawEntry, title: string, summary: string): string {
  const text = `${title} ${summary}`;
  const patterns = [/\b8-K\b/i, /\b10-K\b/i, /\b10-Q\b/i, /\b6-K\b/i, /\bS-1\b/i, /\b424B3\b/i, /\bSC 13D\b/i, /\bSC 13G\b/i, /\b13D\b/i, /\b13G\b/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizeSecFormType(match[0]);
    }
  }

  const categories = ensureArray(entry.category);
  for (const category of categories) {
    if (category?.term) {
      return normalizeSecFormType(category.term);
    }
  }

  return "UNKNOWN";
}

function extractSecAccession(entry: SecRawEntry): string {
  const source = normalizeText(entry.id) || extractSecLink(entry);
  const match = source.match(/(\d{10}-\d{2}-\d{6})/);
  return match ? match[1] : source.trim();
}

function extractSecCompany(title: string): string {
  const match = title.match(/-\s+(.+?)\s+\(\d{10}\)/);
  if (match) {
    return match[1].trim();
  }
  return title ? title.slice(0, 120) : "UNKNOWN";
}

function classifySecEntry(formType: string, title: string, summary: string): SecSentiment {
  const text = `${formType} ${title} ${summary}`.toUpperCase();

  if (SEC_POSITIVE_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return "호재가능";
  }
  if (SEC_NEGATIVE_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return "악재가능";
  }
  if (["8-K", "10-K", "10-Q", "6-K"].includes(formType)) {
    return "중요공시";
  }
  return "일반공시";
}

function extractSecLink(entry: SecRawEntry): string {
  const links = ensureArray(entry.link);
  const alternate = links.find((link) => link?.href);
  return alternate?.href ?? "";
}

export async function fetchSecFeed(): Promise<FeedPayload<SecItem>> {
  const response = await fetch(SEC_URL, {
    cache: "no-store",
    headers: {
      Accept: "application/atom+xml, application/xml, text/xml",
      "User-Agent": SEC_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`SEC RSS 요청 실패: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const items = ensureArray<SecRawEntry>(parsed?.feed?.entry).reduce<SecItem[]>((acc, entry) => {
      const title = normalizeText(entry.title);
      const summary = normalizeText(entry.summary);
      const formType = extractSecFormType(entry, title, summary);
      const sentiment = classifySecEntry(formType, title, summary);

      if (!SEC_TARGET_FORMS.has(formType) || !["호재가능", "악재가능"].includes(sentiment)) {
        return acc;
      }

      acc.push({
        source: "SEC" as const,
        accession: extractSecAccession(entry),
        company: extractSecCompany(title),
        formType,
        sentiment,
        publishedAt: normalizeText(entry.published) || normalizeText(entry.updated),
        title,
        summary,
        link: extractSecLink(entry),
      });

      return acc;
    }, []);

  return {
    source: "SEC",
    fetchedAt: new Date().toISOString(),
    items,
  };
}
