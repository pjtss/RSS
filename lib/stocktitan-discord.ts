import type { StockTitanEvaluation } from "@/lib/stocktitan-ai";
import type { StockTitanArticle } from "@/lib/stocktitan-rss";

type StockTitanDiscordArticle = StockTitanArticle & { evaluation: StockTitanEvaluation };

function list(values: string[]) {
  return values.length ? values.slice(0, 5).map((value) => `• ${value}`).join("\n") : "-";
}

function color(sentiment: StockTitanEvaluation["sentiment"]) {
  return sentiment === "bullish" ? 0x00ffa3 : sentiment === "bearish" ? 0xef4444 : sentiment === "neutral" ? 0x94a3b8 : 0xf59e0b;
}

export function getStockTitanDiscordWebhookUrl() {
  return process.env.STOCKTITAN_DISCORD_WEBHOOK_URL?.trim() || "";
}

export function isStockTitanDiscordConfigured() {
  return Boolean(getStockTitanDiscordWebhookUrl());
}

export function buildStockTitanDiscordPayload(article: StockTitanDiscordArticle) {
  const { evaluation } = article;
  const symbol = evaluation.ticker ? ` (${evaluation.ticker})` : "";
  return {
    content: `StockTitan 뉴스 평가: ${evaluation.sentiment}${symbol}`.slice(0, 2000),
    username: "STOCKMAN StockTitan",
    allowed_mentions: { parse: [] as string[] },
    embeds: [{
      title: `${evaluation.company || "StockTitan 기사"}${symbol}`.slice(0, 256),
      url: article.link,
      description: evaluation.summary.slice(0, 4096),
      color: color(evaluation.sentiment),
      fields: [
        { name: "호재 가능성", value: `${evaluation.bullishProbability}%`, inline: true },
        { name: "중요도", value: `${evaluation.materiality}%`, inline: true },
        { name: "신뢰도", value: `${evaluation.confidence}%`, inline: true },
        { name: "이벤트", value: evaluation.eventType || "-", inline: true },
        { name: "근거", value: list(evaluation.evidence) },
        { name: "위험요인", value: list(evaluation.risks) },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "STOCKMAN StockTitan AI Analyzer" },
    }],
  };
}

export async function sendStockTitanEvaluationToDiscord(article: StockTitanDiscordArticle) {
  const webhook = getStockTitanDiscordWebhookUrl();
  if (!webhook) throw new Error("STOCKTITAN_DISCORD_WEBHOOK_URL is not configured");
  const url = new URL(webhook);
  url.searchParams.set("wait", "true");
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildStockTitanDiscordPayload(article)),
  });
  if (![200, 204].includes(response.status)) throw new Error(`StockTitan Discord 전송 실패: ${response.status}`);
  return { status: response.status };
}
