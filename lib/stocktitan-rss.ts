import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";

export const STOCKTITAN_RSS_URL = process.env.STOCKTITAN_RSS_URL || "https://www.stocktitan.net/rss";

export type StockTitanArticle = {
  externalId: string;
  guid: string;
  title: string;
  link: string;
  description: string;
  publishedAt: string | null;
  contentHash: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  processEntities: true,
  htmlEntities: true,
});

function asArray<T>(value: T | T[] | undefined): T[] { return value ? (Array.isArray(value) ? value : [value]) : []; }

function text(value: unknown): string {
  if (typeof value === "string") return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
  if (value && typeof value === "object" && "#text" in value) return String((value as { "#text": unknown })["#text"]).trim();
  return "";
}

function linkValue(value: unknown): string {
  if (typeof value === "string") return text(value);
  if (value && typeof value === "object" && "href" in value) return text((value as { href?: unknown }).href);
  return "";
}

function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }

export async function fetchStockTitanRss(fetcher: typeof fetch = fetch): Promise<string> {
  const response = await fetcher(STOCKTITAN_RSS_URL, {
    cache: "no-store",
    headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`StockTitan RSS 요청 실패: ${response.status}`);
  const xml = await response.text();
  if (!xml.trim().startsWith("<")) throw new Error("StockTitan RSS 응답이 XML이 아닙니다.");
  return xml;
}

export function parseStockTitanRss(xml: string): StockTitanArticle[] {
  const parsed = parser.parse(xml);
  const rssItems = asArray<Record<string, unknown>>(parsed?.rss?.channel?.item);
  const atomItems = asArray<Record<string, unknown>>(parsed?.feed?.entry);
  const rawItems = [...rssItems, ...atomItems];

  return rawItems.map((item) => {
    const guid = text(item.guid) || text(item.id);
    const title = text(item.title);
    const link = linkValue(item.link) || text(item.url);
    const description = text(item.description) || text(item.summary) || text(item.content);
    const publishedAt = text(item.pubDate) || text(item.published) || text(item.updated) || null;
    const externalId = guid || link || hash(`${title}|${publishedAt}|${description}`);
    return {
      externalId,
      guid,
      title,
      link,
      description,
      publishedAt,
      contentHash: hash(`${title}\n${description}\n${link}`),
    };
  }).filter((item) => item.title && item.link);
}
