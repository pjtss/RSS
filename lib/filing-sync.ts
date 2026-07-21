import { loadAdminFeatureFlags } from "./admin-flags";
import { runDartAutomation } from "./dart-automation";
import { isDartOpen } from "./scanner-hours";
import { runSecAutomation } from "./sec-automation";
import { runStockTitanAutomation } from "./stocktitan-automation";

export type FilingSyncResult = {
  success: true;
  dart: unknown;
  sec: unknown;
  stocktitan: unknown;
};

export async function runFilingSync(): Promise<FilingSyncResult> {
  const flags = await loadAdminFeatureFlags();

  const dart = flags.dart_realtime && (await isDartOpen())
    ? await runDartAutomation()
    : {
        skipped: true,
        reason: flags.dart_realtime
          ? "DART disabled outside schedule"
          : "DART disabled by admin",
      };

  const sec = flags.sec_realtime
    ? await runSecAutomation()
    : { skipped: true, reason: "SEC disabled by admin" };

  const stocktitan = process.env.STOCKTITAN_ENABLED === "true"
    ? await runStockTitanAutomation()
    : { skipped: true, reason: "StockTitan disabled by environment" };

  return { success: true, dart, sec, stocktitan };
}
