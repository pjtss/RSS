import type { SecItem } from "./types";
import { extractSecAiText, fetchSecRawDocument } from "./sec-raw-document";
import { prepareSecDocument, type SecDocumentMetadata, type SecDocumentSection } from "./sec-document-parser";

export type SecAiPayload = {
  accession: string;
  title: string;
  summary: string;
  formType: string;
  sentiment: string;
  link: string;
  text: string;
  metadata: SecDocumentMetadata;
  sections: SecDocumentSection[];
};

export function buildSecAiPayloadFromDocument(url: string, html: string, fallback?: Partial<SecAiPayload>): SecAiPayload {
  const prepared = prepareSecDocument(html);
  return {
    accession: fallback?.accession || "",
    title: fallback?.title || prepared.metadata.registrantName || prepared.metadata.documentType || "SEC filing",
    summary: fallback?.summary || "",
    formType: fallback?.formType || prepared.metadata.documentType || "",
    sentiment: fallback?.sentiment || "",
    link: fallback?.link || url,
    text: prepared.aiText,
    metadata: prepared.metadata,
    sections: prepared.sections,
  };
}

export async function buildSecAiPayload(item: SecItem): Promise<SecAiPayload> {
  const document = item.link ? await fetchSecRawDocument(item.link) : null;
  const preparedPayload = document ? buildSecAiPayloadFromDocument(document.url, document.html, item) : null;

  return {
    accession: item.accession,
    title: item.title,
    summary: item.summary,
    formType: item.formType,
    sentiment: item.sentiment,
    link: item.link,
    text: preparedPayload?.text || (document ? extractSecAiText(document) : ""),
    metadata: preparedPayload?.metadata || {
      documentType: item.formType,
      registrantName: item.company,
      tradingSymbol: "",
      reportDate: item.publishedAt,
    },
    sections: preparedPayload?.sections || [],
  };
}
