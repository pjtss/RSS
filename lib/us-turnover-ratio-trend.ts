import { and, desc, eq, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { usTurnoverRatioSnapshots } from "@/lib/schema";
import type { UsTurnoverRatioItem } from "@/lib/us-turnover-ratio";

export type UsTurnoverRatioTrend = {
  oneMinuteIncrease: number | null;
  threeMinuteIncrease: number | null;
  fiveMinuteIncrease: number | null;
  oneMinuteSignal: boolean;
  threeMinuteSignal: boolean;
  fiveMinuteSignal: boolean;
};

export type UsTurnoverRatioItemWithTrend = UsTurnoverRatioItem & { trend: UsTurnoverRatioTrend };

const windows = [
  { minutes: 1, threshold: 1, key: "oneMinuteIncrease" as const, signal: "oneMinuteSignal" as const },
  { minutes: 3, threshold: 1.3, key: "threeMinuteIncrease" as const, signal: "threeMinuteSignal" as const },
  { minutes: 5, threshold: 5, key: "fiveMinuteIncrease" as const, signal: "fiveMinuteSignal" as const },
];

export async function saveAndCalculateUsTurnoverRatioTrends(items: UsTurnoverRatioItem[], observedAt = new Date()): Promise<UsTurnoverRatioItemWithTrend[]> {
  const db = getDb();
  if (!db) throw new Error("Database connection is not available.");
  const result: UsTurnoverRatioItemWithTrend[] = [];

  for (const item of items) {
    const previous = await Promise.all(windows.map(async ({ minutes }) => {
      const cutoff = new Date(observedAt.getTime() - minutes * 60_000);
      const rows = await db.select().from(usTurnoverRatioSnapshots)
        .where(and(eq(usTurnoverRatioSnapshots.code, item.code), lte(usTurnoverRatioSnapshots.observedAt, cutoff)))
        .orderBy(desc(usTurnoverRatioSnapshots.observedAt)).limit(1);
      return rows[0] ?? null;
    }));

    const increases = previous.map((row) => row ? item.turnoverRatio - row.turnoverRatio : null);
    const trend: UsTurnoverRatioTrend = {
      oneMinuteIncrease: increases[0],
      threeMinuteIncrease: increases[1],
      fiveMinuteIncrease: increases[2],
      oneMinuteSignal: increases[0] !== null && increases[0] >= 1,
      threeMinuteSignal: increases[1] !== null && increases[1] >= 1.3,
      fiveMinuteSignal: increases[2] !== null && increases[2] >= 5,
    };

    await db.insert(usTurnoverRatioSnapshots).values({
      code: item.code,
      name: item.name,
      marketCap: item.marketCap,
      tradingValue: item.tradingValue,
      turnoverRatio: item.turnoverRatio,
      observedAt,
    }).onConflictDoNothing();
    result.push({ ...item, trend });
  }
  return result;
}
