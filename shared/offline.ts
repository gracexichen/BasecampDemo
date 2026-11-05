import { findSampleByText } from "./samples";
import type { ExtractedField, Template } from "./schemas";

/**
 * Offline demonstration extractor. It does NOT call Claude.
 *
 * - For the built-in synthetic samples it returns a hand-written fixture.
 * - For any other text it runs a few simple pattern rules (dates, client IDs,
 *   contact type) and marks everything else "not stated" for staff to fill in.
 *
 * Like the live path, it never fills a field without a quote from the note.
 */
export interface OfflineResult {
  fields: Record<string, ExtractedField>;
  flags: string[];
  engine: string;
}

const NOT_STATED: ExtractedField = { status: "not_stated", value: "", evidence: "" };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

interface FoundDate {
  iso: string;
  raw: string;
  index: number;
}

function findDates(text: string): FoundDate[] {
  const out: FoundDate[] = [];
  const pad = (n: number) => String(n).padStart(2, "0");
  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    out.push({ iso: `${m[1]}-${m[2]}-${m[3]}`, raw: m[0], index: m.index ?? 0 });
  }
  for (const m of text.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)) {
    out.push({ iso: `${m[3]}-${pad(+m[1])}-${pad(+m[2])}`, raw: m[0], index: m.index ?? 0 });
  }
  for (const m of text.matchAll(/\b([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})\b/g)) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    if (mi >= 0) out.push({ iso: `${m[3]}-${pad(mi + 1)}-${pad(+m[2])}`, raw: m[0], index: m.index ?? 0 });
  }
  return out.sort((a, b) => a.index - b.index);
}

const CONTACT_PATTERNS: [RegExp, string][] = [
  [/home visit/i, "Home visit"],
  [/office visit|came in|walk-?in/i, "Office visit"],
  [/phone call|called|by phone/i, "Phone call"],
  [/video call|zoom|video visit/i, "Video call"],
  [/health fair|community event|outreach event/i, "Community event"],
];

function heuristic(template: Template, text: string): OfflineResult {
  const fields: Record<string, ExtractedField> = {};
  for (const f of template.fields) fields[f.key] = { ...NOT_STATED };

  const dates = findDates(text);
  const followIdx = text.search(/follow[ -]?up|check back|call (her|him|them) on/i);
  const followDate =
    followIdx >= 0 ? dates.find((d) => d.index >= followIdx && d.index - followIdx < 60) : undefined;
  const visitDate = dates.find((d) => d !== followDate);
  if (visitDate && fields.visit_date) fields.visit_date = { status: "stated", value: visitDate.iso, evidence: visitDate.raw };
  if (followDate && fields.follow_up_date)
    fields.follow_up_date = { status: "stated", value: followDate.iso, evidence: followDate.raw };

  const id = text.match(/\b[A-Z]-\d{3,6}\b/);
  if (id) fields.client_id = { status: "stated", value: id[0], evidence: id[0] };

  for (const [re, label] of CONTACT_PATTERNS) {
    const m = text.match(re);
    if (m) {
      fields.contact_type = { status: "stated", value: label, evidence: m[0] };
      break;
    }
  }

  const staff = text.match(/\b(?:Staff|CHW):\s*([A-Z][a-z]+(?: [A-Z]\.?)?)/);
  if (staff) fields.staff_name = { status: "stated", value: staff[1], evidence: staff[0] };

  return {
    fields,
    flags: [
      "Offline pattern matching only found dates, IDs and contact type. Fill in the rest from the note, or add an API key to use Claude.",
    ],
    engine: "Offline pattern rules (not Claude)",
  };
}

export function offlineExtract(template: Template, text: string): OfflineResult {
  const sample = findSampleByText(text);
  if (sample && sample.templateId === template.id) {
    const fields: Record<string, ExtractedField> = {};
    for (const f of template.fields) fields[f.key] = sample.fixture[f.key] ?? { ...NOT_STATED };
    return { fields, flags: sample.flags, engine: "Offline demo fixture (not Claude)" };
  }
  return heuristic(template, text);
}
