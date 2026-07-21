import { ensureSchema, withAdvisoryLock } from "@/lib/db";
import { runTrackedAutomation } from "@/lib/tracked-automation";
import { claimNewStockTitanArticles, listStockTitanPendingNotifications, markStockTitanEvaluated, markStockTitanFailed, markStockTitanNotified } from "@/lib/stocktitan-repository";
import { evaluateStockTitanArticle } from "@/lib/stocktitan-ai";
import { fetchStockTitanRss, parseStockTitanRss } from "@/lib/stocktitan-rss";
import { isStockTitanDiscordConfigured, sendStockTitanEvaluationToDiscord } from "@/lib/stocktitan-discord";

const MAX_ARTICLES_PER_RUN = 10;

export async function runStockTitanAutomation() {
  await ensureSchema();
  const locked = await withAdvisoryLock("stockman:stocktitan-rss", async () => runTrackedAutomation("stocktitan-rss", async () => {
    const articles = parseStockTitanRss(await fetchStockTitanRss()).slice(0, MAX_ARTICLES_PER_RUN);
    const fresh = await claimNewStockTitanArticles(articles);
    const results = [];
    const pending = isStockTitanDiscordConfigured() ? await listStockTitanPendingNotifications(MAX_ARTICLES_PER_RUN) : [];
    for (const article of fresh) {
      try {
        const result = await evaluateStockTitanArticle(article);
        await markStockTitanEvaluated(article.externalId, result.model, result.evaluation);
        pending.push({ ...article, aiEvaluation: result.evaluation, status: "evaluated" } as typeof pending[number]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await markStockTitanFailed(article.externalId, message);
        results.push({ externalId: article.externalId, status: "failed", error: message });
      }
    }
    let sent = 0;
    for (const article of pending) {
      try {
        await sendStockTitanEvaluationToDiscord({
          externalId: article.externalId, guid: article.guid || "", title: article.title, link: article.link,
          description: article.description, publishedAt: article.publishedAt?.toISOString() || null,
          contentHash: article.contentHash, evaluation: article.aiEvaluation as never,
        });
        await markStockTitanNotified(article.externalId);
        results.push({ externalId: article.externalId, status: "notified" });
        sent += 1;
      } catch (error) {
        results.push({ externalId: article.externalId, status: "notification_failed", error: error instanceof Error ? error.message : String(error) });
      }
    }
    return { matched: fresh.length, sent, articles: results };
  }));
  return locked.locked ? locked.value : { skipped: true, reason: "already_running" };
}
