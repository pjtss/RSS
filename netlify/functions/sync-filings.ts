import { schedule } from "@netlify/functions";

export const handler = schedule("* * * * *", async () => {
  // Netlify provides the site's primary URL in process.env.URL (e.g. https://your-site.netlify.app)
  const siteUrl = process.env.URL || "http://localhost:3000";
  const secret = process.env.CRON_SECRET || "";
  
  try {
    const targetUrl = `${siteUrl}/api/cron/sync-filings?secret=${secret}`;
    console.log(`[Cron] Triggering sync filings at: ${siteUrl}/api/cron/sync-filings`);
    
    const response = await fetch(targetUrl, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[Cron] Sync filings successful:", data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message: "Sync filings triggered successfully",
        data,
      }),
    };
  } catch (err) {
    console.error("[Cron] Error triggering sync filings:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: String(err),
      }),
    };
  }
});
