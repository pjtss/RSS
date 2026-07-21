import { getPool } from "./db";

export const DEFAULT_AUTOMATION_INTERVAL_SECONDS = 30;

export async function getAutomationIntervalSeconds() {
  try {
    const result = await getPool().query<{ interval_seconds: number }>(
      "SELECT interval_seconds FROM automation_settings WHERE key = 'global' LIMIT 1",
    );
    return Math.max(5, Math.min(3600, Number(result.rows[0]?.interval_seconds ?? DEFAULT_AUTOMATION_INTERVAL_SECONDS)));
  } catch {
    return DEFAULT_AUTOMATION_INTERVAL_SECONDS;
  }
}

export async function saveAutomationIntervalSeconds(seconds: number) {
  const value = Math.max(5, Math.min(3600, Math.round(seconds)));
  await getPool().query(
    `INSERT INTO automation_settings (key, interval_seconds, updated_at) VALUES ('global', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET interval_seconds = EXCLUDED.interval_seconds, updated_at = NOW()`,
    [value],
  );
  return value;
}
