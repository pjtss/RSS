import { schedule } from "@netlify/functions";
import { ensureSchema } from "../../lib/db";
import { runUsTurnoverWatchAutomation } from "../../lib/us-turnover-watch";

export const handler = schedule("*/1 * * * *", async () => {
  try {
    await ensureSchema();
    const data = await runUsTurnoverWatchAutomation();
    console.log("[Cron] US turnover watch completed:", data);
    return { statusCode: 200, body: JSON.stringify({ ok: true, data }) };
  } catch (error) {
    console.error("[Cron] US turnover watch failed:", error);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(error) }) };
  }
});
