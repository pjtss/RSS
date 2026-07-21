import { describe, expect, it } from "vitest";
import { buildStockTitanDiscordPayload } from "./stocktitan-discord";

describe("StockTitan Discord payload", () => {
  it("keeps article evidence and scores in a bounded embed", () => {
    const payload = buildStockTitanDiscordPayload({
      externalId: "1", guid: "1", title: "Contract", link: "https://example.test/1",
      description: "Description", publishedAt: null, contentHash: "hash",
      evaluation: {
        sentiment: "bullish", bullishProbability: 82, materiality: 70, confidence: 90,
        eventType: "contract", company: "Example Inc.", ticker: "EXMP", summary: "Positive contract news.",
        evidence: ["Contract value is stated"], risks: ["Execution risk"], timeHorizon: "short_term", needsManualReview: false,
      },
    });
    expect(payload.content).toContain("bullish");
    expect(payload.embeds[0].fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "호재 가능성", value: "82%" }),
      expect.objectContaining({ name: "근거", value: "• Contract value is stated" }),
    ]));
  });
});
