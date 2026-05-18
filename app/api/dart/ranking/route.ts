import { NextResponse } from "next/server";
import { fetchDartFeed } from "@/lib/rss";
import { calculateDartScore } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await fetchDartFeed();

    const ranked = payload.items
      .map((item) => {
        const { score } = calculateDartScore(item.title);
        return { ...item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // 상위 20건

    return NextResponse.json({
      fetchedAt: payload.fetchedAt,
      items: ranked,
    });
  } catch (error) {
    console.error("Ranking API error:", error);
    return NextResponse.json({ error: "Failed to fetch ranking" }, { status: 500 });
  }
}
