import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Programs and templates                                              */
/* ------------------------------------------------------------------ */

export const FieldTypeSchema = z.enum(["text", "longtext", "date", "select", "list"]);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export const FieldDefSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  label: z.string(),
  type: FieldTypeSchema,
  required: z.boolean(),
  section: z.string(),
  help: z.string(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});
export type FieldDef = z.infer<typeof FieldDefSchema>;

export const ProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  color: z.string(),
});
export type Program = z.infer<typeof ProgramSchema>;

export const TemplateSchema = z.object({
  id: z.string(),
  programId: z.string(),
  name: z.string(),
  documentType: z.string(),
  version: z.string(),
  status: z.enum(["active", "planned"]),
  description: z.string(),
  fields: z.array(FieldDefSchema),
});
export type Template = z.infer<typeof TemplateSchema>;

/* ------------------------------------------------------------------ */
/* Extraction (what the AI, or the offline extractor, returns)         */
/* ------------------------------------------------------------------ */

export const ExtractedFieldSchema = z.object({
  status: z.enum(["stated", "not_stated"]),
  value: z.string(),
  evidence: z.string(),
});
export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;

export const ExtractionModeSchema = z.enum(["live", "offline"]);
export type ExtractionMode = z.infer<typeof ExtractionModeSchema>;

export const ExtractionMetaSchema = z.object({
  mode: ExtractionModeSchema,
  /** Human-readable source, e.g. "Claude (claude-opus-5-5)" or "Offline demo fixture". */
  engine: z.string(),
  model: z.string().nullable(),
  durationMs: z.number(),
  inputTokens: z.number().nullable(),
  outputTokens: z.number().nullable(),
  estCostUsd: z.number().nullable(),
  flags: z.array(z.string()),
  createdAt: z.string(),
});
export type ExtractionMeta = z.infer<typeof ExtractionMetaSchema>;

export const ExtractRequestSchema = z.object({
  templateId: z.string(),
  sourceText: z.string().trim().min(20, "Enter at least a sentence or two of case information.").max(20000),
  mode: ExtractionModeSchema,
});
export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

export const ExtractResponseSchema = z.object({
  fields: z.record(z.string(), ExtractedFieldSchema),
  meta: ExtractionMetaSchema,
});
export type ExtractResponse = z.infer<typeof ExtractResponseSchema>;

/* ------------------------------------------------------------------ */
/* Records                                                             */
/* ------------------------------------------------------------------ */

export const FieldEntrySchema = z.object({
  value: z.string(),
  /** Where the current value came from. */
  origin: z.enum(["ai", "staff", "empty"]),
  /** What the AI proposed (kept for audit and quality metrics). */
  aiValue: z.string(),
  aiStatus: z.enum(["stated", "not_stated"]),
  evidence: z.string(),
  /** Staff explicitly confirmed this required field is not stated in the source. */
  notStatedConfirmed: z.boolean(),
});
export type FieldEntry = z.infer<typeof FieldEntrySchema>;

export const HistoryEntrySchema = z.object({
  at: z.string(),
  action: z.enum(["created", "saved_draft", "approved", "reopened", "seeded"]),
  by: z.string(),
  note: z.string().optional(),
});
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

export const RecordStatusSchema = z.enum(["draft", "approved"]);
export type RecordStatus = z.infer<typeof RecordStatusSchema>;

export const CaseRecordSchema = z.object({
  id: z.string(),
  programId: z.string(),
  templateId: z.string(),
  templateVersion: z.string(),
  status: RecordStatusSchema,
  sourceText: z.string(),
  fields: z.record(z.string(), FieldEntrySchema),
  extraction: ExtractionMetaSchema.nullable(),
  reviewer: z.string(),
  approvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  history: z.array(HistoryEntrySchema),
  synthetic: z.literal(true),
});
export type CaseRecord = z.infer<typeof CaseRecordSchema>;

export const CreateRecordSchema = z.object({
  templateId: z.string(),
  sourceText: z.string().max(20000),
  fields: z.record(z.string(), FieldEntrySchema),
  extraction: ExtractionMetaSchema.nullable(),
});
export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;

export const UpdateRecordSchema = z.object({
  fields: z.record(z.string(), FieldEntrySchema),
  reviewer: z.string().max(120).optional(),
});
export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>;

export const ApproveRecordSchema = z.object({
  fields: z.record(z.string(), FieldEntrySchema),
  reviewer: z.string().trim().min(2, "Enter the reviewer's name.").max(120),
  attested: z.literal(true, { error: "Confirm you reviewed the record against the source note." }),
});
export type ApproveRecordInput = z.infer<typeof ApproveRecordSchema>;

/* ------------------------------------------------------------------ */
/* Validation and quality                                              */
/* ------------------------------------------------------------------ */

export const IssueSchema = z.object({
  fieldKey: z.string(),
  severity: z.enum(["error", "warning"]),
  code: z.enum([
    "missing_required",
    "invalid_date",
    "date_order",
    "invalid_option",
    "ungrounded",
    "confirmed_not_stated",
  ]),
  message: z.string(),
});
export type Issue = z.infer<typeof IssueSchema>;

export interface ValidationResult {
  issues: Issue[];
  requiredTotal: number;
  requiredFilled: number;
  requiredConfirmedNotStated: number;
  canApprove: boolean;
}

export interface AppConfig {
  liveAvailable: boolean;
  model: string;
  credentialHint: string;
}
