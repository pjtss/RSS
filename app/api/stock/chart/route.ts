import { NextResponse } from "next/server";
import { fetchChartData } from "@/lib/kis-chart";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const company = searchParams.get("company") ?? code;

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  try {
    const data = await fetchChartData(code);
    if (!data) {
      return NextResponse.json(
        { error: "차트 데이터를 불러올 수 없습니다. KIS API 자격증명을 확인하세요." },
        { status: 503 }
      );
    }

    // caller가 넘긴 company명이 있으면 덮어씀
    if (company) data.company = company;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[API /stock/chart] Error:", err.message);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
