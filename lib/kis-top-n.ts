import { getDb } from "@/lib/db";
import { usTopRisingConfig } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function loadUsTopRisingCount(): Promise<number> {
  const db = getDb();
  if (!db) return 10;
  const rows = await db.select().from(usTopRisingConfig).where(eq(usTopRisingConfig.key, "default")).limit(1);
  const value = rows[0]?.topN;
  return Number.isFinite(value) && value > 0 ? value : 10;
}

export async function saveUsTopRisingCount(topN: number) {
  const db = getDb();
  if (!db) throw new Error("Database connection is not available.");
  await db.insert(usTopRisingConfig)
    .values({ key: "default", topN, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: usTopRisingConfig.key,
      set: { topN, updatedAt: new Date() },
    });
}
