import { randomUUID } from "node:crypto";
import { getTemplate } from "../shared/programs";
import { SAMPLE_NOTES } from "../shared/samples";
import type { CaseRecord, FieldEntry } from "../shared/schemas";
import { entriesFromExtraction } from "../shared/validation";
import type { RecordStore } from "./db";

interface SeedSpec {
  sampleId: string;
  status: "draft" | "approved";
  daysAgo: number;
  reviewer: string;
  /** Staff edits applied on top of the fixture. */
  edits?: Record<string, string>;
}

const SEEDS: SeedSpec[] = [
  {
    sampleId: "housing-fire-displacement",
    status: "approved",
    daysAgo: 9,
    reviewer: "Rosa M. (demo CHW)",
  },
  {
    sampleId: "health-medicaid-renewal",
    status: "approved",
    daysAgo: 8,
    reviewer: "Marcus T. (demo CHW)",
    edits: { supervisor_flags: "Out of diabetes test strips until coverage is restored." },
  },
  {
    sampleId: "education-school-support",
    status: "approved",
    daysAgo: 6,
    reviewer: "Luis P. (demo CHW)",
    edits: { summary: "Client wants her son to catch up in math before the semester ends. She wants to take English classes but works evenings, so a morning class may fit." },
  },
  {
    sampleId: "health-dental-fair",
    status: "draft",
    daysAgo: 3,
    reviewer: "",
  },
];

/** Replace every record with the fixed demo set. */
export function resetDemo(store: RecordStore, now = new Date()): CaseRecord[] {
  store.clear();
  const out: CaseRecord[] = [];
  for (const spec of SEEDS) {
    const sample = SAMPLE_NOTES.find((n) => n.id === spec.sampleId)!;
    const template = getTemplate(sample.templateId)!;
    const fields: Record<string, FieldEntry> = entriesFromExtraction(template, sample.fixture);
    for (const [k, v] of Object.entries(spec.edits ?? {})) {
      fields[k] = { ...fields[k], value: v, origin: "staff" };
    }
    const at = new Date(now.getTime() - spec.daysAgo * 86400000).toISOString();
    const record: CaseRecord = {
      id: randomUUID(),
      programId: sample.programId,
      templateId: template.id,
      templateVersion: template.version,
      status: spec.status,
      sourceText: sample.text,
      fields,
      extraction: {
        mode: "offline",
        engine: "Offline demo fixture (not Claude)",
        model: null,
        durationMs: 0,
        inputTokens: null,
        outputTokens: null,
        estCostUsd: null,
        flags: sample.flags,
        createdAt: at,
      },
      reviewer: spec.reviewer,
      approvedAt: spec.status === "approved" ? at : null,
      createdAt: at,
      updatedAt: at,
      history: [
        { at, action: "seeded", by: "Demo reset", note: "Synthetic example record" },
        ...(spec.status === "approved" ? [{ at, action: "approved" as const, by: spec.reviewer }] : []),
      ],
      synthetic: true,
    };
    out.push(store.put(record));
  }
  store.setMeta("last_reset", now.toISOString());
  return out;
}
