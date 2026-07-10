import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateSecFilingWithAi } from "./sec-ai-evaluator";
import { buildSecAiPayloadFromDocument } from "./sec-ai-payload";
import { parseSecFilingUrl } from "./sec-filing-url";

const broadcomUrl =
  "https://www.sec.gov/Archives/edgar/data/1730168/000119312526295589/d123456d8k.htm?utm_source=test#tracking";

const broadcomHtml = `
  <html>
    <body>
      <ix:nonNumeric name="dei:DocumentType">8-K</ix:nonNumeric>
      <ix:nonNumeric name="dei:EntityRegistrantName">Broadcom Inc.</ix:nonNumeric>
      <ix:nonNumeric name="dei:TradingSymbol">AVGO</ix:nonNumeric>
      <ix:nonNumeric name="dei:DocumentPeriodEndDate">July 6, 2026</ix:nonNumeric>
      <ix:nonNumeric name="dei:EntityCentralIndexKey">1730168</ix:nonNumeric>
      <p>Item 8.01 Other Events.</p>
      <p>
        Broadcom Inc. ("Broadcom") and Apple Inc. ("Apple") have agreed to expand their long-standing
        technology collaboration through 2031 by entering into new multi-year long-term agreements for
        Broadcom to develop and supply a range of custom ASIC silicon products for use in multiple
        generations of Apple products.
      </p>
      <p>Cautionary Note Regarding Forward-Looking Statements</p>
      <p>This sentence should not drive the AI payload.</p>
      <p>Item 9.01 Financial Statements and Exhibits.</p>
      <p>Exhibit 99.1 Press release.</p>
      <p>SIGNATURE</p>
    </body>
  </html>
`;

function buildBroadcomPayload() {
  const urlInfo = parseSecFilingUrl(broadcomUrl);
  return buildSecAiPayloadFromDocument(urlInfo.canonicalUrl, broadcomHtml, undefined, urlInfo);
}

describe("SEC AI pipeline", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-openai-key", OPENAI_MODEL: "test-model" };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  it("normalizes the Broadcom SEC URL and builds the 8-K event payload", () => {
    const urlInfo = parseSecFilingUrl(broadcomUrl);
    const payload = buildBroadcomPayload();

    expect(urlInfo.canonicalUrl).toBe(
      "https://www.sec.gov/Archives/edgar/data/1730168/000119312526295589/d123456d8k.htm",
    );
    expect(urlInfo.cik).toBe("1730168");
    expect(urlInfo.accessionNumber).toBe("0001193125-26-295589");
    expect(urlInfo.accessionCompact).toBe("000119312526295589");
    expect(payload.formType).toBe("8-K");
    expect(payload.company).toBe("Broadcom Inc.");
    expect(payload.ticker).toBe("AVGO");
    expect(payload.reportDate).toBe("July 6, 2026");
    expect(payload.events).toEqual([
      expect.objectContaining({
        type: "OTHER_EVENT",
        item: "8.01",
        title: "Other Events",
      }),
    ]);
    expect(payload.text).toContain("Item 8.01 Other Events");
    expect(payload.text).not.toContain("Financial Statements and Exhibits");
    expect(payload.text).not.toContain("SIGNATURE");
    expect(payload.promptText).toContain("Company: Broadcom Inc.");
    expect(payload.promptText).toContain("Ticker: AVGO");
    expect(payload.promptText).toContain("Form: 8-K");
    expect(payload.promptText).toContain("Report date: July 6, 2026");
    expect(payload.promptText).toContain("Accession: 0001193125-26-295589");
    expect(payload.promptText).toContain("Event 1: OTHER_EVENT");
  });

  it("requests the expanded AI schema and preserves fact/inference/unknown separation", async () => {
    const payload = buildBroadcomPayload();
    const mockEvaluation = {
      level: "bullish",
      fundamentalScore: 85,
      catalystScore: 70,
      shortTermImpactScore: 60,
      longTermImpactScore: 85,
      confidence: 85,
      noveltyScore: 75,
      surpriseScore: 60,
      alreadyPricedInRisk: 35,
      materialityScore: null,
      summary:
        "브로드컴과 애플의 장기 기술 협력 확대는 장기 펀더멘털에 긍정적이지만 계약 규모가 공개되지 않아 단기 급등 판단에는 제한이 있다.",
      facts: [
        "Broadcom Inc. and Apple Inc. have agreed to expand their long-standing technology collaboration through 2031.",
        "Broadcom will develop and supply custom ASIC silicon products for multiple generations of Apple products.",
      ],
      inferences: ["장기 매출 가시성이 개선될 가능성이 있다."],
      unknowns: [
        "계약 금액이 공개되지 않았다.",
        "최소 구매량이 공개되지 않았다.",
        "예상 매출 기여도가 공개되지 않았다.",
      ],
      risks: ["시장 기대치가 이미 일부 반영되었을 가능성이 있다."],
      marketImpact: "장기적으로는 긍정적이나 단기 급등 촉매 강도는 계약 규모 부재로 제한된다.",
      timeHorizon: {
        immediate: "positive",
        shortTerm: "positive",
        longTerm: "strong_positive",
      },
    };

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output_text: JSON.stringify(mockEvaluation) }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await evaluateSecFilingWithAi(payload);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const schema = body.text.format.schema;

    expect(schema.required).toContain("fundamentalScore");
    expect(schema.required).toContain("catalystScore");
    expect(schema.required).toContain("shortTermImpactScore");
    expect(schema.required).toContain("longTermImpactScore");
    expect(schema.required).toContain("facts");
    expect(schema.required).toContain("inferences");
    expect(schema.required).toContain("unknowns");
    expect(schema.required).not.toContain("score");
    expect(schema.properties.timeHorizon.required).toEqual(["immediate", "shortTerm", "longTerm"]);
    expect(body.instructions).toContain("Good long-term news is not the same as a short-term price spike catalyst.");
    expect(body.instructions).toContain("Put only text explicitly stated in the filing into facts.");
    expect(body.input).toContain("Event 1: OTHER_EVENT");

    expect(result.skipped).toBe(false);
    if (!result.skipped) {
      expect(result.evaluation.materialityScore).toBeNull();
      expect(result.evaluation.facts[0]).toContain("Broadcom Inc. and Apple Inc.");
      expect(result.evaluation.inferences[0]).toContain("가능성");
      expect(result.evaluation.unknowns).toContain("계약 금액이 공개되지 않았다.");
      expect(result.evaluation.timeHorizon).toEqual({
        immediate: "positive",
        shortTerm: "positive",
        longTerm: "strong_positive",
      });
    }
  });
});
