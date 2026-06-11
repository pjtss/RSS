const KST_TIME_ZONE = "Asia/Seoul";

function getKstDate(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
}

export function isDomesticScannerOpen(now = new Date()): boolean {
  const kst = getKstDate(now);
  const minutes = kst.getHours() * 60 + kst.getMinutes();
  const start = 8 * 60;
  const end = 15 * 60 + 30;
  return minutes >= start && minutes < end;
}

export function isUsScannerOpen(now = new Date()): boolean {
  const kst = getKstDate(now);
  const minutes = kst.getHours() * 60 + kst.getMinutes();
  const start = 17 * 60;
  const end = 2 * 60; // 다음날 02:00까지
  return minutes >= start || minutes < end;
}
