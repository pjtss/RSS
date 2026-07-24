import { describe, expect, it } from "vitest";
import { meetsTradingValueIncreaseAlert } from "./us-turnover-ratio-automation";

describe("US turnover trading-value alert threshold", () => {
  it("uses the configured threshold inclusively", () => {
    expect(meetsTradingValueIncreaseAlert(20_000, 20_000)).toBe(true);
    expect(meetsTradingValueIncreaseAlert(19_999.99, 20_000)).toBe(false);
    expect(meetsTradingValueIncreaseAlert(null, 20_000)).toBe(false);
  });
});
