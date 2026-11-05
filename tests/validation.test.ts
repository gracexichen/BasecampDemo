import { describe, expect, it } from "vitest";
import { offlineExtract } from "../shared/offline";
import { PROGRAMS, TEMPLATES, getTemplate } from "../shared/programs";
import { SAMPLE_NOTES } from "../shared/samples";
import { TemplateSchema } from "../shared/schemas";
import { entriesFromExtraction, isGrounded, isValidIsoDate, validateRecord } from "../shared/validation";

const housing = getTemplate("housing-visit-note")!;
const housingSample = SAMPLE_NOTES.find((s) => s.id === "housing-eviction-notice")!;

describe("templates", () => {
  it("every template matches the schema and belongs to a program", () => {
    for (const t of TEMPLATES) {
      expect(() => TemplateSchema.parse(t)).not.toThrow();
      expect(PROGRAMS.some((p) => p.id === t.programId)).toBe(true);
    }
  });

  it("each program has an active Case / Visit Note with a required follow-up date", () => {
    for (const p of PROGRAMS) {
      const t = TEMPLATES.find((x) => x.programId === p.id && x.status === "active")!;
      expect(t.documentType).toBe("Case / Visit Note");
      expect(t.fields.find((f) => f.key === "follow_up_date")?.required).toBe(true);
    }
  });
});

describe("synthetic samples", () => {
  it("every fixture value is grounded in a verbatim quote from its note (no invented facts)", () => {
    for (const s of SAMPLE_NOTES) {
      const t = getTemplate(s.templateId)!;
      for (const def of t.fields) {
        const f = s.fixture[def.key];
        expect(f, `${s.id}.${def.key} is defined`).toBeDefined();
        if (f.status === "stated") {
          expect(isGrounded(f.evidence, s.text), `${s.id}.${def.key} evidence "${f.evidence}"`).toBe(true);
          if (def.type === "date") expect(isValidIsoDate(f.value)).toBe(true);
          if (def.type === "select") expect(def.options).toContain(f.value);
        } else {
          expect(f.value).toBe("");
        }
      }
    }
  });

  it("uses only fictional IDs and demo staff labels", () => {
    for (const s of SAMPLE_NOTES) {
      expect(s.text).toMatch(/\(demo/);
      expect(s.text).toMatch(/\b[HNE]-\d{4}\b/);
    }
  });
});

describe("validateRecord", () => {
  it("flags the missing follow-up date in the housing demo note", () => {
    const fields = entriesFromExtraction(housing, offlineExtract(housing, housingSample.text).fields);
    const v = validateRecord(housing, fields, housingSample.text);
    expect(v.canApprove).toBe(false);
    const errors = v.issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ fieldKey: "follow_up_date", code: "missing_required" });
  });

  it("allows approval once staff add the follow-up date", () => {
    const fields = entriesFromExtraction(housing, offlineExtract(housing, housingSample.text).fields);
    fields.follow_up_date = { ...fields.follow_up_date, value: "2026-11-10", origin: "staff" };
    const v = validateRecord(housing, fields, housingSample.text);
    expect(v.canApprove).toBe(true);
    expect(v.requiredFilled).toBe(v.requiredTotal);
  });

  it("allows approval when staff confirm a field is not stated, but keeps a warning", () => {
    const fields = entriesFromExtraction(housing, offlineExtract(housing, housingSample.text).fields);
    fields.follow_up_date = { ...fields.follow_up_date, notStatedConfirmed: true };
    const v = validateRecord(housing, fields, housingSample.text);
    expect(v.canApprove).toBe(true);
    expect(v.issues.some((i) => i.code === "confirmed_not_stated")).toBe(true);
  });

  it("rejects bad dates, out-of-order dates and unknown options", () => {
    const fields = entriesFromExtraction(housing, offlineExtract(housing, housingSample.text).fields);
    fields.follow_up_date = { ...fields.follow_up_date, value: "2026-10-01", origin: "staff" };
    fields.housing_status = { ...fields.housing_status, value: "Probably fine", origin: "staff" };
    let v = validateRecord(housing, fields, housingSample.text);
    expect(v.issues.map((i) => i.code)).toEqual(expect.arrayContaining(["date_order", "invalid_option"]));

    fields.follow_up_date = { ...fields.follow_up_date, value: "2026-02-30" };
    v = validateRecord(housing, fields, housingSample.text);
    expect(v.issues.some((i) => i.code === "invalid_date")).toBe(true);
  });

  it("warns when an AI value's quote is not in the note", () => {
    const fields = entriesFromExtraction(housing, offlineExtract(housing, housingSample.text).fields);
    fields.household_size = { ...fields.household_size, value: "6", aiValue: "6", evidence: "six people live there" };
    const v = validateRecord(housing, fields, housingSample.text);
    expect(v.issues.find((i) => i.fieldKey === "household_size")?.code).toBe("ungrounded");
  });
});

describe("offline extractor", () => {
  it("uses pattern rules for non-sample text and leaves the rest not stated", () => {
    const text = "11/04/2026 phone call with client H-5555. Staff: Ana R. Discussed rent. Follow up 11/18/2026.";
    const r = offlineExtract(housing, text);
    expect(r.engine).toMatch(/not Claude/);
    expect(r.fields.client_id.value).toBe("H-5555");
    expect(r.fields.visit_date.value).toBe("2026-11-04");
    expect(r.fields.follow_up_date.value).toBe("2026-11-18");
    expect(r.fields.contact_type.value).toBe("Phone call");
    expect(r.fields.summary.status).toBe("not_stated");
    for (const f of Object.values(r.fields)) if (f.status === "stated") expect(isGrounded(f.evidence, text)).toBe(true);
  });
});
