import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { sendSecResultToDiscord, type SecDiscordResult } from "@/lib/discord-sec";

export async function POST(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = body?.result as SecDiscordResult | undefined;
  if (!result) {
    return NextResponse.json({ error: "result payload is required" }, { status: 400 });
  }

  try {
    const discord = await sendSecResultToDiscord(result);
    if (!discord.ok) {
      return NextResponse.json(
        {
          error: "Discord webhook send failed",
          discord,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      discord,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Discord webhook send failed",
      },
      { status: 500 },
    );
  }
}
