import { ensureSchema, getPool } from "./db";
import { fetchDartFeed, fetchSecFeed, getTodayInSeoul } from "./rss";
import type { AlertItem, DartItem, FeedPayload, SecItem } from "./types";

function toPublishedDateSeoul(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toAlertItem(item: DartItem | SecItem): AlertItem {
  return {
    source: item.source,
    externalId: item.source === "DART" ? item.link : item.accession || item.link,
    level: item.source === "DART" ? item.judgment : item.sentiment,
    company: item.company,
    title: item.title,
    link: item.link,
    publishedAt: item.publishedAt,
  };
}

export async function markAlertsDelivered(alerts: AlertItem[]) {
  if (alerts.length === 0) {
    return;
  }

  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    for (const alert of alerts) {
      await client.query(
        `
          INSERT INTO alert_events (source, external_id)
          VALUES ($1, $2)
          ON CONFLICT (source, external_id) DO NOTHING
        `,
        [alert.source, alert.externalId],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function loadNewAlerts(source: "DART" | "SEC", todayInSeoul: string): Promise<AlertItem[]> {
  const client = await getPool().connect();

  try {
    const bullishLevels = source === "DART" ? ["최강호재", "호재가능"] : ["호재가능"];
    const { rows } = await client.query(
      `
        SELECT source, external_id, company, title, judgment, link, published_at
        FROM filings
        WHERE source = $1
          AND published_date_seoul = $2::date
          AND judgment = ANY($3::text[])
          AND NOT EXISTS (
            SELECT 1
            FROM alert_events
            WHERE alert_events.source = filings.source
              AND alert_events.external_id = filings.external_id
          )
        ORDER BY published_at DESC
      `,
      [source, todayInSeoul, bullishLevels],
    );

    return rows.map((row) => ({
      source: row.source,
      externalId: row.external_id,
      level: row.judgment,
      company: row.company,
      title: row.title,
      link: row.link,
      publishedAt: new Date(row.published_at).toISOString(),
    }));
  } finally {
    client.release();
  }
}

async function saveDartItems(items: DartItem[]) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    for (const item of items) {
      await client.query(
        `
          INSERT INTO filings (
            source, external_id, company, title, judgment, form_type,
            keywords, summary, published_at, published_date_seoul, link
          ) VALUES (
            'DART', $1, $2, $3, $4, NULL,
            $5::text[], '', $6::timestamptz, $7::date, $8
          )
          ON CONFLICT (source, external_id) DO UPDATE SET
            company = EXCLUDED.company,
            title = EXCLUDED.title,
            judgment = EXCLUDED.judgment,
            keywords = EXCLUDED.keywords,
            published_at = EXCLUDED.published_at,
            published_date_seoul = EXCLUDED.published_date_seoul,
            link = EXCLUDED.link,
            updated_at = NOW()
        `,
        [
          item.link,
          item.company,
          item.title,
          item.judgment,
          item.keywords,
          item.publishedAt,
          toPublishedDateSeoul(item.publishedAt),
          item.link,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function saveSecItems(items: SecItem[]) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    for (const item of items) {
      await client.query(
        `
          INSERT INTO filings (
            source, external_id, company, title, judgment, form_type,
            keywords, summary, published_at, published_date_seoul, link
          ) VALUES (
            'SEC', $1, $2, $3, $4, $5,
            '{}'::text[], $6, $7::timestamptz, $8::date, $9
          )
          ON CONFLICT (source, external_id) DO UPDATE SET
            company = EXCLUDED.company,
            title = EXCLUDED.title,
            judgment = EXCLUDED.judgment,
            form_type = EXCLUDED.form_type,
            summary = EXCLUDED.summary,
            published_at = EXCLUDED.published_at,
            published_date_seoul = EXCLUDED.published_date_seoul,
            link = EXCLUDED.link,
            updated_at = NOW()
        `,
        [
          item.accession || item.link,
          item.company,
          item.title,
          item.sentiment,
          item.formType,
          item.summary,
          item.publishedAt,
          toPublishedDateSeoul(item.publishedAt),
          item.link,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function syncDartAlerts(): Promise<FeedPayload<DartItem>> {
  await ensureSchema();
  const payload = await fetchDartFeed();
  await saveDartItems(payload.items);

  const todayInSeoul = getTodayInSeoul();
  const newAlerts = await loadNewAlerts("DART", todayInSeoul);

  return {
    ...payload,
    newAlerts,
  };
}

export async function syncSecAlerts(): Promise<FeedPayload<SecItem>> {
  await ensureSchema();
  const payload = await fetchSecFeed();
  await saveSecItems(payload.items);

  const todayInSeoul = getTodayInSeoul();
  const newAlerts = await loadNewAlerts("SEC", todayInSeoul);

  return {
    ...payload,
    newAlerts,
  };
}

export async function getRecentDartBullishFeed(hours = 1): Promise<FeedPayload<DartItem>> {
  await ensureSchema();
  const client = await getPool().connect();

  try {
    const { rows } = await client.query(
      `
        SELECT company, title, judgment, keywords, published_at, link
        FROM filings
        WHERE source = 'DART'
          AND judgment = ANY($1::text[])
          AND published_at >= NOW() - ($2::text || ' hours')::interval
        ORDER BY published_at DESC
      `,
      [["최강호재", "호재가능"], String(hours)],
    );

    return {
      source: "DART",
      fetchedAt: new Date().toISOString(),
      items: rows.map((row) => ({
        source: "DART",
        company: row.company,
        title: row.title,
        judgment: row.judgment,
        keywords: row.keywords ?? [],
        publishedAt: new Date(row.published_at).toISOString(),
        link: row.link,
      })),
    };
  } finally {
    client.release();
  }
}

export async function getRecentSecBullishFeed(hours = 1): Promise<FeedPayload<SecItem>> {
  await ensureSchema();
  const client = await getPool().connect();

  try {
    const { rows } = await client.query(
      `
        SELECT external_id, company, title, judgment, form_type, summary, published_at, link
        FROM filings
        WHERE source = 'SEC'
          AND judgment = '호재가능'
          AND published_at >= NOW() - ($1::text || ' hours')::interval
        ORDER BY published_at DESC
      `,
      [String(hours)],
    );

    return {
      source: "SEC",
      fetchedAt: new Date().toISOString(),
      items: rows.map((row) => ({
        source: "SEC",
        accession: row.external_id,
        company: row.company,
        formType: row.form_type ?? "UNKNOWN",
        sentiment: row.judgment,
        publishedAt: new Date(row.published_at).toISOString(),
        title: row.title,
        summary: row.summary ?? "",
        link: row.link,
      })),
    };
  } finally {
    client.release();
  }
}
