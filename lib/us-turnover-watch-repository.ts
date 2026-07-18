import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { usTurnoverRatioWatches } from "@/lib/schema";

export async function listUsTurnoverWatches() {
  const db = getDb();
  return db.select().from(usTurnoverRatioWatches).orderBy(asc(usTurnoverRatioWatches.ticker));
}

export async function addUsTurnoverWatch(ticker: string, threshold: number) {
  const db = getDb();
  return db.insert(usTurnoverRatioWatches).values({ ticker, threshold }).onConflictDoUpdate({
    target: usTurnoverRatioWatches.ticker,
    set: { threshold },
  }).returning();
}

export async function removeUsTurnoverWatch(ticker: string) {
  const db = getDb();
  return db.delete(usTurnoverRatioWatches).where(eq(usTurnoverRatioWatches.ticker, ticker));
}
