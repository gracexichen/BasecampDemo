import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getProgram, getTemplate, sections } from "../../shared/programs";
import { validateRecord } from "../../shared/validation";
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
  StatusBadge,
} from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAppState } from "../lib/app-state";
import { formatDate, formatDateTime, money } from "../lib/format";
import { useAsync } from "../lib/useAsync";

const ACTION_LABELS = {
  created: "Created from note",
  saved_draft: "Draft saved",
  approved: "Approved",
  reopened: "Reopened for edits",
  seeded: "Loaded as demo record",
} as const;

export function RecordDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useAppState();
  const { data: record, error, loading } = useAsync(() => api.record(id), [id]);
  const [reopening, setReopening] = useState(false);

  if (loading && !record) return <LoadingState label="Loading record…" />;
  if (error || !record)
    return (
      <Callout tone="red" icon="warning" title="Couldn't open this record.">
        {error}
      </Callout>
    );

  const template = getTemplate(record.templateId)!;
  const program = getProgram(record.programId)!;
  const v = validateRecord(template, record.fields, record.sourceText);
  const x = record.extraction;

  async function reopen() {
    setReopening(true);
    try {
      await api.reopenRecord(record!.id, record!.reviewer || "Staff (demo)");
      toast("Record reopened. It is a draft until approved again.", "info");
      navigate(`/records/${record!.id}/review`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't reopen the record.", "error");
    } finally {
      setReopening(false);
    }
  }

  return (
    <>
      <PageHeader
        title={record.fields.client_id?.value || "Record"}
        back={{ to: "/records", label: "Saved Records" }}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <ProgramDot color={program.color} />
            {program.name} · {template.documentType} v{record.templateVersion}
          </span>
        }
        actions={
          <>
            <a
              href={api.exportUrl(record.id)}
              download
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-separator-strong bg-surface px-3.5 text-[13px] font-medium text-label shadow-card hover:bg-surface-2"
            >
              <Icon name="download" />
              Export JSON
            </a>
            {record.status === "approved" ? (
              <Button icon="pencil" onClick={() => void reopen()} disabled={reopening}>
                Reopen to edit
              </Button>
            ) : (
              <Button variant="primary" icon="pencil" onClick={() => navigate(`/records/${record.id}/review`)}>
                Continue review
              </Button>
            )}
          </>
        }
      />
      {record.status === "approved" && <StepIndicator current={5} />}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={record.status} />
        {record.status === "approved" && (
          <span className="text-[13px] text-label-2">
            by <strong className="font-semibold text-label">{record.reviewer}</strong> on {formatDateTime(record.approvedAt)}
          </span>
        )}
        <span className="text-[13px] text-label-3">·</span>
        <span className="text-[13px] text-label-2">
          {v.requiredFilled + v.requiredConfirmedNotStated} of {v.requiredTotal} required fields complete
        </span>
        <Badge tone="neutral" icon="lock">Synthetic record</Badge>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {sections(template).map((s) => (
            <Card key={s.name} title={s.name}>
              <dl className="divide-y divide-separator">
                {s.fields.map((def) => {
                  const e = record.fields[def.key];
                  const value = e?.value.trim() ?? "";
                  return (
                    <div key={def.key} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[200px_1fr] sm:gap-4">
                      <dt className="text-[13px] text-label-2">
                        {def.label}
                        {def.required && <span className="sr-only"> (required)</span>}
                      </dt>
                      <dd className="text-[14px] text-label">
                        {value ? (
                          def.type === "list" ? (
                            <ul className="list-disc pl-4">
                              {value.split("\n").filter(Boolean).map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          ) : def.type === "date" ? (
                            formatDate(value)
                          ) : (
                            <span className="whitespace-pre-wrap">{value}</span>
                          )
                        ) : (
                          <span className="text-label-3 italic">
                            {e?.notStatedConfirmed ? "Not stated (confirmed by staff)" : "Not stated"}
                          </span>
                        )}
                        {value && e?.origin === "staff" && (
                          <Badge tone="blue" icon="pencil" className="ml-2 align-middle">
                            {e.aiStatus === "stated" ? "Edited by staff" : "Added by staff"}
                          </Badge>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Original note">
            <div className="max-h-[40vh] overflow-y-auto p-4">
              <SourceNote text={record.sourceText} />
            </div>
          </Card>

          {x && (
            <Card title="How this record was created">
              <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 p-4 text-[13px]">
                <dt className="text-label-2">Extraction</dt>
                <dd>
                  {x.mode === "live" ? (
                    <Badge tone="green" icon="sparkles">{x.engine}</Badge>
                  ) : (
                    <Badge tone="orange" icon="bolt">{x.engine}</Badge>
                  )}
                </dd>
                {x.mode === "live" && (
                  <>
                    <dt className="text-label-2">Time</dt>
                    <dd className="text-label">{(x.durationMs / 1000).toFixed(1)} seconds</dd>
                    <dt className="text-label-2">Tokens</dt>
                    <dd className="text-label">
                      {x.inputTokens?.toLocaleString()} in · {x.outputTokens?.toLocaleString()} out
                    </dd>
                    <dt className="text-label-2">Est. cost</dt>
                    <dd className="text-label">{money(x.estCostUsd)} (PRD guardrail: under 5¢)</dd>
                  </>
                )}
                <dt className="text-label-2">Template</dt>
                <dd className="text-label">
                  {template.documentType} v{record.templateVersion}
                </dd>
              </dl>
            </Card>
          )}

          <Card title="Activity">
            <ol className="flex flex-col gap-2.5 p-4">
              {[...record.history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`} className="flex gap-2.5 text-[13px]">
                  <Icon
                    name={h.action === "approved" ? "checkCircle" : h.action === "reopened" ? "arrowCounter" : "doc"}
                    className={h.action === "approved" ? "mt-0.5 text-green" : "mt-0.5 text-label-3"}
                  />
                  <div>
                    <p className="text-label">
                      {ACTION_LABELS[h.action]} <span className="text-label-2">· {h.by}</span>
                    </p>
                    <p className="text-[12px] text-label-3">{formatDateTime(h.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
