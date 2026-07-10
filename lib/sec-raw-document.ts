import { htmlToSecText, prepareSecDocument } from "./sec-document-parser";
import { createSecRequestHeaders } from "./sec-request-headers";

export type SecRawDocument = {
  url: string;
  html: string;
  text: string;
};

export async function fetchSecRawDocument(url: string): Promise<SecRawDocument> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: createSecRequestHeaders("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
  });

  if (!response.ok) {
    throw new Error(`SEC 원문 요청 실패: ${response.status}`);
  }

  const html = await response.text();
  return {
    url,
    html,
    text: htmlToSecText(html),
  };
}

export function extractSecAiText(document: SecRawDocument): string {
  return prepareSecDocument(document.html).aiText;
}
