import { NextResponse } from "next/server";
import { fetchDartFeed, fetchSecFeed, getTodayInSeoul } from "@/lib/rss";
import { getPool, ensureSchema } from "@/lib/db";
import type { DartItem, SecItem } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Netlify Cron / 외부 Cron 서비스에서 호출 — 1분 간격 권장 */
export async function GET(request: Request) {
  // 간단한 인증: CRON_SECRET 헤더 또는 쿼리 파라미터 검사
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const { searchParams } = new URL(request.url);
    const provided =
      request.headers.get("x-cron-secret") ?? searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await ensureSchema();
    const todayInSeoul = getTodayInSeoul();

    // DART + SEC 동시 fetch
    const [dartPayload, secPayload] = await Promise.allSettled([
      fetchDartFeed(),
      fetchSecFeed(),
    ]);

    const pool = getPool();
    const client = await pool.connect();
    let dartSaved = 0;
    let secSaved = 0;

    try {
      await client.query("BEGIN");

      // DART 적재
      if (dartPayload.status === "fulfilled") {
        for (const item of dartPayload.value.items) {
          const result = await client.query(
            `
            INSERT INTO filings (
              source, external_id, company, title, judgment,
              keywords, summary, published_at, published_date_seoul, link
            ) VALUES (
              'DART', $1, $2, $3, $4,
              $5::text[], '', $6::timestamptz, $7::date, $8
            )
            ON CONFLICT (source, external_id) DO NOTHING
            `,
            [
              item.link,
              item.company,
              item.title,
              item.judgment,
              item.keywords,
              item.publishedAt,
              todayInSeoul,
              item.link,
            ]
          );
          dartSaved += result.rowCount ?? 0;
        }
      }

      // SEC 적재
      if (secPayload.status === "fulfilled") {
        for (const item of secPayload.value.items) {
          const result = await client.query(
            `
            INSERT INTO filings (
              source, external_id, company, title, judgment,
              form_type, keywords, summary, published_at, published_date_seoul, link
            ) VALUES (
              'SEC', $1, $2, $3, $4,
              $5, '{}'::text[], $6, $7::timestamptz, $8::date, $9
            )
            ON CONFLICT (source, external_id) DO NOTHING
            `,
            [
              item.accession || item.link,
              item.company,
              item.title,
              item.sentiment,
              item.formType,
              item.summary,
              item.publishedAt,
              todayInSeoul,
              item.link,
            ]
          );
          secSaved += result.rowCount ?? 0;
        }
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      dart: {
        fetched: dartPayload.status === "fulfilled" ? dartPayload.value.items.length : 0,
        saved: dartSaved,
        error: dartPayload.status === "rejected" ? String(dartPayload.reason) : null,
      },
      sec: {
        fetched: secPayload.status === "fulfilled" ? secPayload.value.items.length : 0,
        saved: secSaved,
        error: secPayload.status === "rejected" ? String(secPayload.reason) : null,
      },
    });
  } catch (error) {
    console.error("Cron sync-filings error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
