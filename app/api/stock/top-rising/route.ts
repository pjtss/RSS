import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { topRisingStocks } from "@/lib/schema";
import { syncTopRisingStocks } from "@/lib/kis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    let records = await db.select().from(topRisingStocks);

    // 1. DB가 비어있는 경우, 자동으로 최신 KIS TOP 10 동기화 트리거
    if (records.length === 0) {
      try {
        await syncTopRisingStocks();
        records = await db.select().from(topRisingStocks);
      } catch (syncErr) {
        console.warn("[KIS] Auto sync on empty DB failed:", syncErr);
      }
    }

    // 가짜(Mock/시뮬레이션) 데이터가 절대 흘러나가지 못하게 필터링 적용 (실데이터 무결성 확보)
    const filteredRecords = records.filter((r) => {
      const company = r.company.toLowerCase();
      const code = r.code;
      
      // 시뮬레이션, mock, 상승 종목, 테스트가 들어있거나 코드 형식이 테스트용(00000x 등)인 경우 필터링
      if (company.includes("시뮬레이션") || 
          company.includes("mock") || 
          company.includes("상승 종목") || 
          company.includes("테스트") ||
          code.startsWith("00000") || 
          code.startsWith("90000")) {
        return false;
      }
      return true;
    });

    // 등락률 숫자 기준으로 내림차순 정렬
    const sortedRecords = filteredRecords.sort((a, b) => {
      const rateA = parseFloat(a.changeRate.replace(/[+%]/g, "")) || 0;
      const rateB = parseFloat(b.changeRate.replace(/[+%]/g, "")) || 0;
      return rateB - rateA;
    });

    return NextResponse.json(sortedRecords);
  } catch (error) {
    console.error("Failed to fetch top rising stocks:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
