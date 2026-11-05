import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { getProgram, getTemplate, sections } from "../../shared/programs";
import type { CaseRecord, FieldEntry } from "../../shared/schemas";
import { validateRecord } from "../../shared/validation";
import { FieldControl, editEntry } from "../components/FieldControl";
import { SourceNote } from "../components/SourceNote";
import { StepIndicator } from "../components/StepIndicator";
import {
  Badge,
  Button,
  Callout,
  Card,
  Icon,
  LoadingState,
  PageHeader,
  ProgramDot,
  ProgressBar,
  Spinner,
  cx,
} from "../components/ui";
import { ApiError, api, issuesFrom } from "../lib/api";
import { useAppState } from "../lib/app-state";
import { money } from "../lib/format";
import { useAsync } from "../lib/useAsync";

export function Review() {
  const { id = "" } = useParams();
  const { data, error, loading } = useAsync(() => api.record(id), [id]);

  if (loading && !data) return <LoadingState label="Loading record…" />;
  if (error || !data)
    return (
      <Callout tone="red" icon="warning" title="Couldn't open this record.">
        {error}
      </Callout>
    );
  if (data.status === "approved") return <Navigate to={`/records/${data.id}`} replace />;
  return <ReviewForm key={data.id} record={data} />;
}

function ReviewForm({ record }: { record: CaseRecord }) {
  const template = getTemplate(record.templateId)!;
  const program = getProgram(record.programId)!;
  const navigate = useNavigate();
  const { toast } = useAppState();
  const [fields, setFields] = useState<Record<string, FieldEntry>>(record.fields);
  const [reviewer, setReviewer] = useState(record.reviewer);
  const [attested, setAttested] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "approve" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showApprovalErrors, setShowApprovalErrors] = useState(false);
  const reviewerRef = useRef<HTMLInputElement>(null);

  const validation = useMemo(() => validateRecord(template, fields, record.sourceText), [template, fields, record.sourceText]);
  const errors = validation.issues.filter((i) => i.severity === "error");
  const warnings = validation.issues.filter((i) => i.severity === "warning" && i.code === "ungrounded");
  const changed = JSON.stringify(fields) !== JSON.stringify(record.fields) || reviewer !== record.reviewer;
  const extraction = record.extraction;
  const activeDef = template.fields.find((f) => f.key === activeKey);
  const activeEvidence = activeKey && fields[activeKey]?.value.trim() ? fields[activeKey]?.evidence : undefined;

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!changed) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [changed]);

  const update = (key: string, next: FieldEntry) => setFields((f) => ({ ...f, [key]: next }));

  const focusField = (key: string) => {
    const el = document.getElementById(`field-${key}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
    setActiveKey(key);
  };

  async function saveDraft() {
    setSaving("draft");
    setSubmitError(null);
    try {
      await api.updateRecord(record.id, { fields, reviewer });
      toast("Draft saved.");
      navigate("/records");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Couldn't save the draft.");
    } finally {
      setSaving(null);
    }
  }

  async function approve() {
    setShowApprovalErrors(true);
    setSubmitError(null);
    if (errors.length) {
      focusField(errors[0].fieldKey);
      return;
    }
    if (reviewer.trim().length < 2 || !attested) {
      reviewerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (reviewer.trim().length < 2) reviewerRef.current?.focus({ preventScroll: true });
      return;
    }
    setSaving("approve");
    try {
      const saved = await api.approveRecord(record.id, { fields, reviewer: reviewer.trim(), attested: true });
      toast("Record approved and saved.");
      navigate(`/records/${saved.id}`);
    } catch (e) {
      const serverIssues = issuesFrom(e);
      setSubmitError(
        serverIssues.length
          ? serverIssues.map((i) => i.message).join(" ")
          : e instanceof ApiError
            ? e.message
            : "Couldn't approve the record.",
      );
    } finally {
      setSaving(null);
    }
  }

  const reviewerMissing = showApprovalErrors && reviewer.trim().length < 2;
  const attestMissing = showApprovalErrors && !attested;
  const complete = validation.requiredFilled + validation.requiredConfirmedNotStated;

  return (
    <>
      <PageHeader
        title={`Review: ${fields.client_id?.value || "new record"}`}
        back={{ to: "/records", label: "Saved Records" }}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <ProgramDot color={program.color} />
            {program.name} · {template.documentType} v{template.version} · Draft
          </span>
        }
      />
      <StepIndicator current={3} />

      {extraction && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-label-2">
          {extraction.mode === "live" ? (
            <Badge tone="green" icon="sparkles">
              Standardized by {extraction.engine}
            </Badge>
          ) : (
            <Badge tone="orange" icon="bolt">
              {extraction.engine}
            </Badge>
          )}
          {extraction.mode === "live" && (
            <span>
              {(extraction.durationMs / 1000).toFixed(1)}s · {extraction.inputTokens?.toLocaleString()} in /{" "}
              {extraction.outputTokens?.toLocaleString()} out tokens · est. {money(extraction.estCostUsd)}
            </span>
          )}
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Left: source note, sticky so evidence stays visible while reviewing */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4">
          <Card
            title="Original note"
            description={
              activeDef ? (
                activeEvidence ? (
                  <>
                    Highlighting the quote for <strong className="text-label">{activeDef.label}</strong>
                  </>
                ) : (
                  <>
                    <strong className="text-label">{activeDef.label}</strong>: no supporting quote in the note
                  </>
                )
              ) : (
                "Hover over or select a field to see where it came from."
              )
            }
          >
            <div className="max-h-[52vh] overflow-y-auto p-4">
              <SourceNote text={record.sourceText} evidence={activeEvidence} label={activeDef?.label} />
            </div>
          </Card>

          {extraction && extraction.flags.length > 0 && (
            <Card title={extraction.mode === "live" ? "Claude flagged" : "Flagged for review"}>
              <ul className="flex flex-col gap-2 p-4">
                {extraction.flags.map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] text-label">
                    <Icon name="info" className="mt-0.5 text-blue" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Right: structured, editable record */}
        <div className="flex flex-col gap-4">
          <Card as="div">
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-label">
                  Required fields: {complete} of {validation.requiredTotal} complete
                </p>
                {errors.length === 0 ? (
                  <Badge tone="green" icon="checkCircle">
                    Ready to approve
                  </Badge>
                ) : (
                  <Badge tone="red" icon="warning">
                    {errors.length} to fix
                  </Badge>
                )}
              </div>
              <ProgressBar
                value={validation.requiredTotal ? complete / validation.requiredTotal : 0}
                tone={errors.length ? "orange" : "green"}
                label="Required fields complete"
              />
              {(errors.length > 0 || warnings.length > 0) && (
                <ul className="flex flex-col gap-1" aria-label="Fields that need attention">
                  {[...errors, ...warnings].map((i) => (
                    <li key={`${i.fieldKey}-${i.code}`}>
                      <button
                        type="button"
                        onClick={() => focusField(i.fieldKey)}
                        className={cx(
                          "flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left text-[13px] hover:bg-fill",
                          i.severity === "error" ? "text-red" : "text-orange",
                        )}
                      >
                        <Icon name="warning" className="mt-0.5 size-3.5" />
                        <span className="text-label">{i.message}</span>
                        <Icon name="chevronRight" className="mt-0.5 ml-auto size-3.5 text-label-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {sections(template).map((s) => (
            <Card key={s.name} title={s.name}>
              <div className="flex flex-col gap-1 px-4 py-2">
                {s.fields.map((def) => (
                  <FieldControl
                    key={def.key}
                    def={def}
                    entry={fields[def.key]}
                    issues={validation.issues.filter((i) => i.fieldKey === def.key)}
                    onFocus={() => setActiveKey(def.key)}
                    onChange={(v) => update(def.key, editEntry(fields[def.key], v))}
                    onConfirmNotStated={(c) => update(def.key, { ...fields[def.key], notStatedConfirmed: c })}
                  />
                ))}
              </div>
            </Card>
          ))}

          <Card title="Human approval" description="A staff member must check the record against the original note.">
            <div className="flex flex-col gap-3 p-4">
              <div>
                <label htmlFor="reviewer" className="mb-1.5 block text-[13px] font-semibold text-label">
                  Reviewer name<span className="ml-0.5 text-red" aria-hidden="true">*</span>
                </label>
                <input
                  id="reviewer"
                  ref={reviewerRef}
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  placeholder="e.g. Rosa M. (demo CHW)"
                  autoComplete="off"
                  aria-invalid={reviewerMissing || undefined}
                  aria-describedby={reviewerMissing ? "reviewer-error" : undefined}
                  className={cx(
                    "block h-9 w-full max-w-[360px] rounded-lg border bg-surface px-3 text-[14px] text-label focus:border-accent focus:outline-none",
                    reviewerMissing ? "border-red" : "border-separator-strong",
                  )}
                />
                {reviewerMissing && (
                  <p id="reviewer-error" className="mt-1 text-[12px] font-medium text-red">
                    Enter the reviewer's name.
                  </p>
                )}
              </div>
              <label className="flex items-start gap-2.5 text-[13px] text-label">
                <input
                  type="checkbox"
                  checked={attested}
                  onChange={(e) => setAttested(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--accent)]"
                  aria-invalid={attestMissing || undefined}
                />
                <span>
                  I reviewed every field against the original note. Nothing was added that the note doesn't say.
                  {attestMissing && <span className="mt-0.5 block font-medium text-red">Check this box to approve.</span>}
                </span>
              </label>
            </div>
          </Card>

          {submitError && (
            <Callout tone="red" icon="warning" title="Not saved.">
              {submitError}
            </Callout>
          )}

          {/* Action bar */}
          <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-separator bg-surface/95 px-4 py-3 shadow-raised backdrop-blur">
            <p className="text-[13px] text-label-2" aria-live="polite">
              {errors.length
                ? `${errors.length} field${errors.length === 1 ? "" : "s"} must be fixed before approval.`
                : "All required fields are complete."}
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={() => void saveDraft()} disabled={saving !== null}>
                {saving === "draft" && <Spinner />}
                Save draft
              </Button>
              <Button variant="primary" icon={saving === "approve" ? undefined : "checkCircle"} onClick={() => void approve()} disabled={saving !== null}>
                {saving === "approve" && <Spinner className="text-white" />}
                Approve and save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
