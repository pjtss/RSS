import type { SecAiPayload } from "./sec-ai-payload";

export type SecBullishLevel =
  | "strong_bullish"
  | "bullish"
  | "slightly_bullish"
  | "neutral"
  | "negative"
  | "uncertain";

export type SecAiEvaluation = {
  level: SecBullishLevel;
  fundamentalScore: number | null;
  catalystScore: number | null;
  shortTermImpactScore: number | null;
  longTermImpactScore: number | null;
  confidence: number;
  noveltyScore: number | null;
  surpriseScore: number | null;
  alreadyPricedInRisk: number | null;
  materialityScore: number | null;
  summary: string;
  facts: string[];
  inferences: string[];
  unknowns: string[];
  risks: string[];
  marketImpact: string;
  timeHorizon: {
    immediate: SecTimeHorizonImpact;
    shortTerm: SecTimeHorizonImpact;
    longTerm: SecTimeHorizonImpact;
  };
};

type SecTimeHorizonImpact =
  | "very_negative"
  | "negative"
  | "neutral"
  | "positive"
  | "strong_positive"
  | "insufficient_data";

export type SecAiEvaluationResult =
  | {
      skipped: false;
      model: string;
      evaluation: SecAiEvaluation;
      rawText: string;
    }
  | {
      skipped: true;
      reason: string;
    };

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";
const MAX_PROMPT_TEXT_LENGTH = 12000;
const impactEnum = ["very_negative", "negative", "neutral", "positive", "strong_positive", "insufficient_data"] as const;

const nullableScore = {
  type: ["integer", "null"],
  minimum: 0,
  maximum: 100,
} as const;

const evaluationSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "level",
    "fundamentalScore",
    "catalystScore",
    "shortTermImpactScore",
    "longTermImpactScore",
    "confidence",
    "noveltyScore",
    "surpriseScore",
    "alreadyPricedInRisk",
    "materialityScore",
    "summary",
    "facts",
    "inferences",
    "unknowns",
    "risks",
    "marketImpact",
    "timeHorizon",
  ],
  properties: {
    level: {
      type: "string",
      enum: ["strong_bullish", "bullish", "slightly_bullish", "neutral", "negative", "uncertain"],
    },
    fundamentalScore: nullableScore,
    catalystScore: nullableScore,
    shortTermImpactScore: nullableScore,
    longTermImpactScore: nullableScore,
    confidence: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    noveltyScore: nullableScore,
    surpriseScore: nullableScore,
    alreadyPricedInRisk: nullableScore,
    materialityScore: nullableScore,
    summary: {
      type: "string",
      description: "Concise Korean summary separating long-term quality from short-term spike potential.",
    },
    facts: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" },
    },
    inferences: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" },
    },
    unknowns: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" },
    },
    risks: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" },
    },
    marketImpact: {
      type: "string",
      description: "Korean explanation of likely stock-market impact and short-term spike limitations.",
    },
    timeHorizon: {
      type: "object",
      additionalProperties: false,
      required: ["immediate", "shortTerm", "longTerm"],
      properties: {
        immediate: { type: "string", enum: impactEnum },
        shortTerm: { type: "string", enum: impactEnum },
        longTerm: { type: "string", enum: impactEnum },
      },
    },
  },
} as const;

function extractOutputText(response: any) {
  if (typeof response?.output_text === "string") return response.output_text;

  const output = Array.isArray(response?.output) ? response.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        return part.text;
      }
    }
  }

  return "";
}

function buildEvaluationInput(payload: SecAiPayload) {
  const promptText =
    payload.promptText.length > MAX_PROMPT_TEXT_LENGTH
      ? `${payload.promptText.slice(0, MAX_PROMPT_TEXT_LENGTH)}\n\n[TRUNCATED]`
      : payload.promptText;

  return [
    `Title: ${payload.title}`,
    `Company: ${payload.metadata.registrantName}`,
    `Ticker: ${payload.metadata.tradingSymbol}`,
    `Form: ${payload.formType}`,
    `Report date: ${payload.metadata.reportDate}`,
    `Accession: ${payload.accession}`,
    `URL: ${payload.link}`,
    "",
    "Events:",
    JSON.stringify(payload.events.map((event) => ({
      type: event.type,
      item: event.item || null,
      title: event.title,
      text: event.text,
    }))),
    "",
    promptText,
  ].join("\n");
}

function getOpenAiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
  };
}

export async function evaluateSecFilingWithAi(payload: SecAiPayload): Promise<SecAiEvaluationResult> {
  const { apiKey, model } = getOpenAiConfig();
  if (!apiKey) {
    return { skipped: true, reason: "OPENAI_API_KEY is not configured" };
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions:
        [
          "You are a US equity disclosure analyst focused on detecting stock price spike potential from SEC filings.",
          "Answer in Korean and return JSON only.",
          "Use only the supplied filing text and event data; do not assume facts not present in the filing.",
          "Do not estimate contract value if the filing does not disclose it.",
          "Do not estimate revenue growth if the filing does not disclose it.",
          "Do not state profit growth as a fact if the filing does not disclose it.",
          "If company size, market cap, revenue, contract value, or minimum purchase data is missing, do not calculate materiality; set materialityScore to null.",
          "If market expectation data is missing, lower confidence for surpriseScore and explain the limitation in unknowns or marketImpact.",
          "Good long-term news is not the same as a short-term price spike catalyst.",
          "Separate explicit facts from reasonable inferences.",
          "Put only text explicitly stated in the filing into facts.",
          "Write inferences as possibilities, not certainties.",
          "Put missing decision-critical information into unknowns.",
          "Scores must be integers from 0 to 100, or null when not judgeable.",
          "facts, inferences, unknowns, and risks must not be empty unless the schema permits it.",
          "Do not output any explanatory prose outside the JSON object.",
        ].join("\n"),
      input: buildEvaluationInput(payload),
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "sec_filing_evaluation",
          strict: true,
          schema: evaluationSchema,
        },
      },
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI evaluation failed: ${response.status} ${raw}`);
  }

  const parsed = JSON.parse(raw);
  const outputText = extractOutputText(parsed);
  if (!outputText) {
    throw new Error("OpenAI evaluation returned no output_text");
  }

  return {
    skipped: false,
    model,
    evaluation: JSON.parse(outputText) as SecAiEvaluation,
    rawText: outputText,
  };
}
