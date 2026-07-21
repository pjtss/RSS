import { describe, expect, it } from "vitest";
import { parseStockTitanRss } from "./stocktitan-rss";

describe("StockTitan RSS parser", () => {
  it("parses RSS 2.0 items and normalizes CDATA", () => {
    const items = parseStockTitanRss(`<?xml version="1.0"?><rss><channel><item><guid>abc-1</guid><title><![CDATA[Example contract]]></title><link>https://example.test/a</link><description><![CDATA[Revenue update]]></description><pubDate>Tue, 21 Jul 2026 10:00:00 GMT</pubDate></item></channel></rss>`);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ externalId: "abc-1", title: "Example contract", link: "https://example.test/a", description: "Revenue update" });
  });

  it("parses Atom entry links", () => {
    const items = parseStockTitanRss(`<feed><entry><id>tag:example.test,2026:1</id><title>Atom article</title><link href="https://example.test/atom"/><summary>Summary</summary><updated>2026-07-21T10:00:00Z</updated></entry></feed>`);
    expect(items[0]).toMatchObject({ externalId: "tag:example.test,2026:1", link: "https://example.test/atom", description: "Summary" });
  });
});
