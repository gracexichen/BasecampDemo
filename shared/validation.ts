import type {
  CaseRecord,
  ExtractedField,
  FieldEntry,
  Issue,
  Template,
  ValidationResult,
} from "./schemas";

/** Normalize for "is this quote really in the note?" checks. */
export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the evidence quote appears in the source note. */
export function isGrounded(evidence: string, sourceText: string): boolean {
  const e = normalizeForMatch(evidence);
  if (!e) return false;
  return normalizeForMatch(sourceText).includes(e);
}

export function isValidIsoDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function isFilled(entry: FieldEntry | undefined): boolean {
  return !!entry && entry.value.trim().length > 0;
}

/** Turn extraction output into editable record entries. */
export function entriesFromExtraction(
  template: Template,
  fields: Record<string, ExtractedField>,
): Record<string, FieldEntry> {
  const out: Record<string, FieldEntry> = {};
  for (const def of template.fields) {
    const x = fields[def.key];
    const stated = x?.status === "stated" && x.value.trim().length > 0;
    out[def.key] = {
      value: stated ? x.value.trim() : "",
      origin: stated ? "ai" : "empty",
      aiValue: stated ? x.value.trim() : "",
      aiStatus: stated ? "stated" : "not_stated",
      evidence: stated ? x.evidence.trim() : "",
      notStatedConfirmed: false,
    };
  }
  return out;
}

/**
 * Deterministic checks that run on every change and again on the server
 * before approval. The AI never decides whether a record is complete.
 */
export function validateRecord(
  template: Template,
  fields: Record<string, FieldEntry>,
  sourceText: string,
): ValidationResult {
  const issues: Issue[] = [];
  let requiredTotal = 0;
  let requiredFilled = 0;
  let requiredConfirmedNotStated = 0;

  for (const def of template.fields) {
    const entry = fields[def.key];
    const value = entry?.value.trim() ?? "";

    if (def.required) {
      requiredTotal++;
      if (value) requiredFilled++;
      else if (entry?.notStatedConfirmed) {
        requiredConfirmedNotStated++;
        issues.push({
          fieldKey: def.key,
          severity: "warning",
          code: "confirmed_not_stated",
          message: `${def.label} was confirmed as not stated by staff.`,
        });
      } else {
        issues.push({
          fieldKey: def.key,
          severity: "error",
          code: "missing_required",
          message: `${def.label} is required and was not found in the note. Add it, or confirm it is not stated.`,
        });
      }
    }

    if (!value) continue;

    if (def.type === "date" && !isValidIsoDate(value)) {
      issues.push({
        fieldKey: def.key,
        severity: "error",
        code: "invalid_date",
        message: `${def.label} must be a valid date.`,
      });
    }

    if (def.type === "select" && def.options && !def.options.includes(value)) {
      issues.push({
        fieldKey: def.key,
        severity: "error",
        code: "invalid_option",
        message: `${def.label} must be one of the template's options.`,
      });
    }

    if (entry?.origin === "ai" && entry.evidence && !isGrounded(entry.evidence, sourceText)) {
      issues.push({
        fieldKey: def.key,
        severity: "warning",
        code: "ungrounded",
        message: `The quote behind ${def.label} could not be found in the note. Check this value.`,
      });
    }
  }

  const visit = fields.visit_date?.value ?? "";
  const follow = fields.follow_up_date?.value ?? "";
  if (isValidIsoDate(visit) && isValidIsoDate(follow) && follow < visit) {
    issues.push({
      fieldKey: "follow_up_date",
      severity: "error",
      code: "date_order",
      message: "Follow-up date is before the visit date.",
    });
  }

  return {
    issues,
    requiredTotal,
    requiredFilled,
    requiredConfirmedNotStated,
    canApprove: !issues.some((i) => i.severity === "error"),
  };
}

/* ------------------------------------------------------------------ */
/* Quality metrics                                                     */
/* ------------------------------------------------------------------ */

export interface QualityReport {
  totals: { records: number; approved: number; drafts: number };
  /** PRD definition: every required field filled in or marked "not stated". */
  completeRate: number | null;
  /** Share of AI-proposed values staff kept without editing. */
  aiAcceptanceRate: number | null;
  avgCostUsd: number | null;
  liveExtractions: number;
  offlineExtractions: number;
  byProgram: { programId: string; approved: number; drafts: number }[];
  /** For each required field: share of records where the original note left it out. */
  missingAtExtraction: { key: string; label: string; missing: number; total: number }[];
  fieldCompletion: { key: string; label: string; filled: number; total: number }[];
}

export function computeQuality(
  records: CaseRecord[],
  getTemplate: (id: string) => Template | undefined,
  programIds: string[],
): QualityReport {
  const approved = records.filter((r) => r.status === "approved");
  let complete = 0;
  let aiProposed = 0;
  let aiKept = 0;
  const costs: number[] = [];
  let live = 0;
  let offline = 0;
  const missing = new Map<string, { label: string; missing: number; total: number }>();
  const completion = new Map<string, { label: string; filled: number; total: number }>();

  for (const r of records) {
    const t = getTemplate(r.templateId);
    if (!t) continue;
    if (r.extraction?.mode === "live") live++;
    if (r.extraction?.mode === "offline") offline++;
    if (r.extraction?.estCostUsd != null) costs.push(r.extraction.estCostUsd);

    for (const def of t.fields) {
      const e = r.fields[def.key];
      if (!e) continue;
      if (e.aiStatus === "stated") {
        aiProposed++;
        if (e.origin === "ai" && e.value.trim() === e.aiValue.trim()) aiKept++;
      }
      if (def.required && r.extraction) {
        const m = missing.get(def.key) ?? { label: def.label, missing: 0, total: 0 };
        m.total++;
        if (e.aiStatus === "not_stated") m.missing++;
        missing.set(def.key, m);
      }
    }

    if (r.status === "approved") {
      const v = validateRecord(t, r.fields, r.sourceText);
      if (v.requiredFilled + v.requiredConfirmedNotStated === v.requiredTotal) complete++;
      for (const def of t.fields.filter((f) => f.required)) {
        const c = completion.get(def.key) ?? { label: def.label, filled: 0, total: 0 };
        c.total++;
        if (isFilled(r.fields[def.key])) c.filled++;
        completion.set(def.key, c);
      }
    }
  }

  return {
    totals: {
      records: records.length,
      approved: approved.length,
      drafts: records.length - approved.length,
    },
    completeRate: approved.length ? complete / approved.length : null,
    aiAcceptanceRate: aiProposed ? aiKept / aiProposed : null,
    avgCostUsd: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : null,
    liveExtractions: live,
    offlineExtractions: offline,
    byProgram: programIds.map((programId) => ({
      programId,
      approved: records.filter((r) => r.programId === programId && r.status === "approved").length,
      drafts: records.filter((r) => r.programId === programId && r.status === "draft").length,
    })),
    missingAtExtraction: [...missing.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.missing / b.total - a.missing / a.total || a.label.localeCompare(b.label)),
    fieldCompletion: [...completion.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.filled / a.total - b.filled / b.total || a.label.localeCompare(b.label)),
  };
}
