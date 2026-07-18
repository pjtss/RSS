import { formatKoreanAmount } from "@/lib/korean-number-format";

export async function sendUsTurnoverWatchToDiscord(items: Array<Record<string, unknown>>) {
  const webhook = process.env.US_TURNOVER_WATCH_DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) throw new Error("US_TURNOVER_WATCH_DISCORD_WEBHOOK_URL is not configured");
  const embeds = items.map((item) => ({
    title: `${item.code} | ${item.market}`,
    color: 0x00ffa3,
    fields: [
      { name: "시총 대비 거래대금", value: `${Number(item.turnoverRatio).toFixed(2)}%`, inline: true },
      { name: "기준 비율", value: `${Number(item.threshold).toFixed(2)}%`, inline: true },
      { name: "시가총액", value: formatKoreanAmount(Number(item.marketCap)), inline: true },
      { name: "당일 거래대금", value: formatKoreanAmount(Number(item.tradingValue)), inline: true },
      { name: "등락률", value: String(item.changeRate ?? "-"), inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "STOCKMAN US Turnover Watch" },
  }));
  const response = await fetch(`${webhook}${webhook.includes("?") ? "&" : "?"}wait=true`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "STOCKMAN US TURNOVER WATCH", allowed_mentions: { parse: [] }, embeds }),
  });
  if (!response.ok) throw new Error(`US turnover watch Discord failed with HTTP ${response.status}`);
  return { ok: true, status: response.status };
}
