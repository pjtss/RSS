import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { buildSecAiPayloadFromDocument } from "@/lib/sec-ai-payload";
import { prepareSecDocument } from "@/lib/sec-document-parser";
import { fetchSecRawDocument } from "@/lib/sec-raw-document";

function isAllowedSecUrl(value: string) {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    return parsed.protocol === "https:" && (hostname === "sec.gov" || hostname.endsWith(".sec.gov"));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sourceUrl = url.searchParams.get("url") || "";
  if (!sourceUrl) {
    return NextResponse.json({ error: "url query parameter is required" }, { status: 400 });
  }
  if (!isAllowedSecUrl(sourceUrl)) {
    return NextResponse.json({ error: "SEC 도메인의 HTTPS URL만 허용됩니다." }, { status: 400 });
  }

  const document = await fetchSecRawDocument(sourceUrl);
  const prepared = prepareSecDocument(document.html);
  const aiPayload = buildSecAiPayloadFromDocument(sourceUrl, document.html);

  return NextResponse.json({
    ok: true,
    status: 200,
    request: {
      method: "GET",
      url: sourceUrl,
    },
    document: {
      htmlLength: document.html.length,
      htmlPreview: document.html.slice(0, 2000),
      textLength: prepared.fullText.length,
      text: prepared.fullText,
      aiTextLength: prepared.aiText.length,
      aiText: prepared.aiText,
      metadata: prepared.metadata,
      sections: prepared.sections,
    },
    aiPayload,
  });
}
