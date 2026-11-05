import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { ExtractedField, Template } from "../shared/schemas";
import { modelName } from "./env";

/** Per-million-token prices (USD) used only for the cost estimate shown in the app. */
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
};

export class ExtractionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const SYSTEM_PROMPT = `You turn a community health worker's unstructured case note into a standardized Case / Visit Note record for a nonprofit that supports families.

The record will be reviewed and approved by staff before it is saved, and it feeds leadership decisions, claims and reports, so accuracy matters more than completeness.

Rules:
- Use only information written in the note. Never add, assume or infer facts that are not there. A gap marked "not_stated" is a correct and useful answer; an invented value is a serious error.
- For every field, set status to "stated" only when the note supports the value. Otherwise set status "not_stated", value "" and evidence "".
- evidence must be a short quote copied character for character from the note that supports the value. Staff use it to check your work, and the app verifies it against the note.
- Dates: output YYYY-MM-DD. Convert only dates the note states with a day, month and year (or a month and day when the year is stated elsewhere in the note for the same visit). If a date is relative ("next week", "after she hears back") mark it not_stated.
- Select fields: the value must be exactly one of the listed options. If none clearly fits, mark it not_stated.
- List fields: one item per line, separated by newline characters, in plain short phrases.
- Long text fields: one to three plain, factual sentences in third person. Do not add judgments or diagnoses.
- Refer to the client as "client" and family members by relationship, never by name. Keep staff names as written.
- In flags, list anything staff should check: missing required information, ambiguous details, or conflicts in the note. Keep each flag to one sentence. Return an empty list if there is nothing to flag.`;

function describeTemplate(t: Template): string {
  return t.fields
    .map((f) => {
      const parts = [`- ${f.key} (${f.label}; ${f.type}${f.required ? "; required" : ""}): ${f.help}`];
      if (f.options) parts.push(`  Options: ${f.options.map((o) => `"${o}"`).join(", ")}`);
      return parts.join("\n");
    })
    .join("\n");
}

function outputSchema(t: Template) {
  const field = z.object({
    status: z.enum(["stated", "not_stated"]),
    value: z.string(),
    evidence: z.string(),
  });
  const shape: Record<string, typeof field> = {};
  for (const f of t.fields) shape[f.key] = field;
  return z.object({ fields: z.object(shape), flags: z.array(z.string()) });
}

export interface LiveResult {
  fields: Record<string, ExtractedField>;
  flags: string[];
  model: string;
  inputTokens: number;
  outputTokens: number;
  estCostUsd: number | null;
}

let client: Anthropic | null = null;

export async function liveExtract(template: Template, sourceText: string): Promise<LiveResult> {
  client ??= new Anthropic({ timeout: 90_000, maxRetries: 1 });
  const model = modelName();

  let response;
  try {
    response = await client.beta.messages.parse({
      model,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(outputSchema(template)) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Template: ${template.documentType} (version ${template.version})\nFields:\n${describeTemplate(template)}\n\n<case_note>\n${sourceText}\n</case_note>`,
        },
      ],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      throw new ExtractionError("The API key was rejected. Check ANTHROPIC_API_KEY in .env.", 502);
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new ExtractionError("Claude is rate limited right now. Wait a moment and try again.", 503);
    }
    if (err instanceof Anthropic.BadRequestError) {
      throw new ExtractionError(`Claude rejected the request: ${err.message}`, 502);
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new ExtractionError("Could not reach the Claude API. Check the internet connection.", 503);
    }
    if (err instanceof Anthropic.APIError) {
      throw new ExtractionError(`Claude API error (${err.status ?? "unknown"}).`, 502);
    }
    throw err;
  }

  if (response.stop_reason === "refusal") {
    throw new ExtractionError("Claude declined to process this note.", 422);
  }
  if (response.stop_reason === "max_tokens") {
    throw new ExtractionError("Claude's answer was cut off. Try a shorter note.", 502);
  }
  const parsed = response.parsed_output;
  if (!parsed) throw new ExtractionError("Claude's answer could not be read as a record.", 502);

  const fields: Record<string, ExtractedField> = {};
  for (const f of template.fields) {
    const x = (parsed.fields as Record<string, ExtractedField>)[f.key];
    fields[f.key] =
      x && x.status === "stated" && x.value.trim()
        ? { status: "stated", value: x.value.trim(), evidence: x.evidence.trim() }
        : { status: "not_stated", value: "", evidence: "" };
  }

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const price = PRICES[response.model] ?? PRICES[model];
  const estCostUsd = price ? (inputTokens * price.input + outputTokens * price.output) / 1_000_000 : null;

  return { fields, flags: parsed.flags, model: response.model, inputTokens, outputTokens, estCostUsd };
}
