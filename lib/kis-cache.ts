import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { kisCache } from "./schema";

export async function readKisCache<T>(key: string): Promise<T | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select({ data: kisCache.data }).from(kisCache).where(eq(kisCache.key, key)).limit(1);
  return rows.length > 0 ? rows[0].data as T : null;
}

export async function writeKisCache<T>(key: string, data: T): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(kisCache).values({ key, data, updatedAt: new Date() }).onConflictDoUpdate({
    target: kisCache.key,
    set: { data, updatedAt: new Date() },
  });
}
