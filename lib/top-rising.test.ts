import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock pg
const mockClient = {
  query: vi.fn().mockResolvedValue({}),
  release: vi.fn(),
};

const mockPool = {
  connect: vi.fn().mockResolvedValue(mockClient),
};

vi.mock("pg", () => {
  return {
    Pool: class {
      connect() {
        return mockPool.connect();
      }
    }
  };
});

// Mock getDb
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

vi.mock("./db", () => {
  return {
    getDb: () => mockDb,
    getPool: () => mockPool,
    ensureSchema: vi.fn(),
  };
});

import { fetchTopRisingStocks, syncTopRisingStocks } from "./kis-us";

describe("Top Rising Stocks Scanner Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchTopRisingStocks in test environment returns mocked items", async () => {
    const data = await fetchTopRisingStocks();
    expect(data).toHaveLength(10);
    expect(data[0].company).toBe("US Rising Stock A");
    expect(data[0].code).toBe("900000");
    expect(data[0].changeRate).toContain("%");
  });

  it("syncTopRisingStocks performs insert, delete, update queries", async () => {
    const oldTop10 = [
      { code: "900000", company: "US Rising Stock A", changeRate: "+29.50%", price: "250.00", addedAt: new Date() },
      { code: "900009", company: "US Rising Stock J", changeRate: "+10.60%", price: "115.00", addedAt: new Date() },
      { code: "888888", company: "상승 종목 제거", changeRate: "+5.00%", price: "5,000", addedAt: new Date() },
    ];

    mockDb.select.mockReturnThis();
    mockDb.from.mockResolvedValue(oldTop10);

    const newlyAdded = await syncTopRisingStocks();

    // 900000 ~ 900009 중 900000, 900009는 old에 존재하므로,
    // 신규 추가는 900001 ~ 900008 (8개)
    expect(newlyAdded).toHaveLength(8);

    expect(mockDb.delete).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalled();
  });
});
