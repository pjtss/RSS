import type { SecDocumentMetadata, SecDocumentSection } from "./sec-document-parser";

export type SecParsedEvent = {
  type: string;
  item?: string;
  title: string;
  text: string;
};

function normalizeFormType(value: string) {
  return value.toUpperCase().trim();
}

function map8KItemType(item: string) {
  const known: Record<string, string> = {
    "1.01": "MATERIAL_DEFINITIVE_AGREEMENT",
    "2.02": "RESULTS_OF_OPERATIONS",
    "5.02": "MANAGEMENT_CHANGE",
    "7.01": "REGULATION_FD_DISCLOSURE",
    "8.01": "OTHER_EVENT",
    "9.01": "FINANCIAL_STATEMENTS_AND_EXHIBITS",
  };

  return known[item] || "FORM_8K_EVENT";
}

function parse8KEvents(sections: SecDocumentSection[]): SecParsedEvent[] {
  const materialSections =
    sections.some((section) => section.item !== "9.01")
      ? sections.filter((section) => section.item !== "9.01")
      : sections;

  return materialSections.map((section) => ({
    type: map8KItemType(section.item),
    item: section.item,
    title: section.title || `Item ${section.item}`,
    text: section.text,
  }));
}

function parseGenericEvents(fullText: string, sections: SecDocumentSection[]): SecParsedEvent[] {
  if (sections.length > 0) {
    return sections.map((section) => ({
      type: "DISCLOSURE_SECTION",
      item: section.item,
      title: section.title || `Item ${section.item}`,
      text: section.text,
    }));
  }

  return [
    {
      type: "DISCLOSURE_TEXT",
      title: "Disclosure text",
      text: fullText,
    },
  ];
}

export function parseSecEventsByForm(
  metadata: SecDocumentMetadata,
  fullText: string,
  sections: SecDocumentSection[],
): SecParsedEvent[] {
  const formType = normalizeFormType(metadata.documentType);
  if (formType === "8-K") return parse8KEvents(sections);

  return parseGenericEvents(fullText, sections);
}

export function buildSecEventsPromptText(metadata: SecDocumentMetadata, events: SecParsedEvent[]) {
  const header = [
    metadata.registrantName ? `Company: ${metadata.registrantName}` : "",
    metadata.tradingSymbol ? `Ticker: ${metadata.tradingSymbol}` : "",
    metadata.documentType ? `Form: ${metadata.documentType}` : "",
    metadata.reportDate ? `Report date: ${metadata.reportDate}` : "",
    metadata.accessionNumber ? `Accession: ${metadata.accessionNumber}` : "",
  ].filter(Boolean);

  const eventText = events
    .map((event, index) => {
      const item = event.item ? `Item ${event.item} ` : "";
      return [`Event ${index + 1}: ${event.type}`, `${item}${event.title}`.trim(), event.text].join("\n");
    })
    .join("\n\n");

  return [...header, "", "Material filing text:", eventText].join("\n");
}
