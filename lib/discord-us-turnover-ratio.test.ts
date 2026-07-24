import { describe, expect, it } from "vitest";
import { buildUsTurnoverRatioDiscordPayload } from "./discord-us-turnover-ratio";

describe("US turnover Discord payload", () => {
  it("does not include the redundant automation footer", () => {
    const payload = buildUsTurnoverRatioDiscordPayload([{
      market: "NAS",
      rank: 1,
      code: "ANY",
      name: "스피어 3D",
      price: "1",
      changeRate: "+18.98",
      marketCap: 16_040_000,
      tradingValue: 620_000,
      turnoverRatio: 3.9,
      openToHighRate: 6.01,
    }]);

    expect(payload.embeds[0]).not.toHaveProperty("footer");
  });
});
