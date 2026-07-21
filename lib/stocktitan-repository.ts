import { eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { stocktitanArticles } from "@/lib/schema";
import type { StockTitanArticle } from "@/lib/stocktitan-rss";

export async function claimNewStockTitanArticles(articles: StockTitanArticle[]) {
  if (!articles.length) return [];
  const db = getDb();
  const ids = articles.map((article) => article.externalId);
  const existing = await db.select({ externalId: stocktitanArticles.externalId })
    .from(stocktitanArticles).where(inArray(stocktitanArticles.externalId, ids));
  const known = new Set(existing.map((row) => row.externalId));
  const fresh = articles.filter((article) => !known.has(article.externalId));
  if (!fresh.length) return [];

  await db.insert(stocktitanArticles).values(fresh.map((article) => ({
    ...article,
    publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
  }))).onConflictDoNothing();
  return fresh;
}

export async function markStockTitanEvaluated(externalId: string, model: string, evaluation: unknown) {
  await getDb().update(stocktitanArticles).set({
    status: "evaluated", aiModel: model, aiEvaluation: evaluation, aiEvaluatedAt: new Date(), updatedAt: new Date(), lastError: null,
  }).where(eq(stocktitanArticles.externalId, externalId));
}

export async function listStockTitanPendingNotifications(limit = 10) {
  return getDb().select().from(stocktitanArticles)
    .where(eq(stocktitanArticles.status, "evaluated")).limit(limit);
}

export async function markStockTitanNotified(externalId: string) {
  await getDb().update(stocktitanArticles).set({ status: "notified", updatedAt: new Date() })
    .where(eq(stocktitanArticles.externalId, externalId));
}

export async function markStockTitanFailed(externalId: string, error: string) {
  await getDb().update(stocktitanArticles).set({
    status: "evaluation_failed", attempts: sql`${stocktitanArticles.attempts} + 1`, lastError: error, updatedAt: new Date(),
  }).where(eq(stocktitanArticles.externalId, externalId));
}
