import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { kisApiConfigs } from "@/lib/schema";

export type KisApiConfigKey = "us_updown_rate" | "us_volume_power";

export type KisApiConfig = {
  KEYB: string;
  AUTH: string;
  EXCD: string;
  GUBN?: string;
  NDAY?: string;
  VOL_RANG?: string;
  tr_id: string;
  custtype: string;
  content_type: string;
  authorization: string;
};

export const DEFAULT_KIS_API_CONFIGS: Record<KisApiConfigKey, KisApiConfig> = {
  us_updown_rate: {
    KEYB: "",
    AUTH: "",
    EXCD: "NAS",
    GUBN: "1",
    NDAY: "0",
    VOL_RANG: "5",
    tr_id: "HHDFS76290000",
    custtype: "P",
    content_type: "application/json; charset=utf-8",
    authorization: "Bearer",
  },
  us_volume_power: {
    KEYB: "",
    AUTH: "",
    EXCD: "NAS",
    NDAY: "0",
    VOL_RANG: "5",
    tr_id: "HHDFS76280000",
    custtype: "P",
    content_type: "application/json; charset=utf-8",
    authorization: "Bearer",
  },
};

export async function loadKisApiConfig(key: KisApiConfigKey): Promise<KisApiConfig> {
  const defaults = DEFAULT_KIS_API_CONFIGS[key];
  const db = getDb();
  if (!db) return defaults;

  const rows = await db.select().from(kisApiConfigs).where(eq(kisApiConfigs.key, key)).limit(1);
  if (rows.length === 0) return defaults;
  return { ...defaults, ...(rows[0].config as Partial<KisApiConfig>) };
}

export async function saveKisApiConfig(key: KisApiConfigKey, config: KisApiConfig) {
  const db = getDb();
  if (!db) throw new Error("Database connection is not available.");
  await db.insert(kisApiConfigs)
    .values({ key, config, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: kisApiConfigs.key,
      set: { config, updatedAt: new Date() },
    });
}
