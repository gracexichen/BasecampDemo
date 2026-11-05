import { PROGRAMS } from "../../shared/programs";
import { Badge, Callout, Card, LoadingState, PageHeader, ProgramDot, ProgressBar } from "../components/ui";
import { api } from "../lib/api";
import { useAppState } from "../lib/app-state";
import { money, percent } from "../lib/format";
import { useAsync } from "../lib/useAsync";

export function Quality() {
  const { dataVersion } = useAppState();
  const { data: q, error, loading } = useAsync(() => api.quality(), [dataVersion]);

  if (loading && !q) return <LoadingState />;
  if (error || !q)
    return (
      <Callout tone="red" icon="warning" title="Couldn't load quality data.">
        {error}
      </Callout>
    );

  const maxProgram = Math.max(1, ...q.byProgram.map((p) => p.approved + p.drafts));

  return (
    <>
      <PageHeader
        title="Documentation Quality"
        subtitle="Are notes complete and consistent? These measures come from the PRD's success plan."
      />

      <Callout tone="orange" icon="info" className="mb-4" title="Demo numbers.">
        Calculated from the synthetic records in this prototype, so they show how the measures would work, not real
        results. Time saved per note has to be measured with CHWs during the pilot.
      </Callout>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Complete approved notes"
          value={percent(q.completeRate)}
          target="Target: at least 4 of 5 (80%)"
          met={q.completeRate == null ? null : q.completeRate >= 0.8}
          help="Every required field filled in or confirmed not stated."
        />
        <Metric
          label="AI values kept without edits"
          value={percent(q.aiAcceptanceRate)}
          target="Early sign: approved with small edits"
          met={null}
          help="Share of values the AI proposed that staff did not change."
        />
        <Metric
          label="Avg. AI cost per note"
          value={q.liveExtractions ? money(q.avgCostUsd) : "—"}
          target="Guardrail: under 5¢"
          met={q.avgCostUsd == null ? null : q.avgCostUsd < 0.05}
          help={q.liveExtractions ? `${q.liveExtractions} live Claude extractions.` : "No live Claude extractions yet."}
        />
        <Metric
          label="Records"
          value={`${q.totals.approved} approved`}
          target={`${q.totals.drafts} draft${q.totals.drafts === 1 ? "" : "s"} in progress`}
          met={null}
          help={`${q.liveExtractions} live · ${q.offlineExtractions} offline extractions`}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card
          title="What notes leave out"
          description="Required fields the original note did not include, before staff review. This shows where training or prompts would help most."
        >
          <ul className="flex flex-col gap-3 p-4">
            {q.missingAtExtraction.every((m) => m.missing === 0) && (
              <li className="text-[13px] text-label-2">No required fields were missing from any note.</li>
            )}
            {q.missingAtExtraction.filter((m) => m.missing > 0).map((m) => (
              <li key={m.key}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-label">{m.label}</span>
                  <span className="tabular-nums text-label-2">
                    {m.missing} of {m.total} notes
                  </span>
                </div>
                <ProgressBar value={m.total ? m.missing / m.total : 0} tone="orange" label={`${m.label} missing`} />
              </li>
            ))}
            {q.missingAtExtraction.some((m) => m.missing === 0) && (
              <li className="border-t border-separator pt-3 text-[12px] text-label-3">
                Always present: {q.missingAtExtraction.filter((m) => m.missing === 0).map((m) => m.label).join(", ")}.
              </li>
            )}
          </ul>
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Required fields in approved records" description="After staff review. Goal: every bar full.">
            <ul className="flex flex-col gap-3 p-4">
              {q.fieldCompletion.length === 0 && <li className="text-[13px] text-label-2">No approved records yet.</li>}
              {q.fieldCompletion.map((f) => (
                <li key={f.key}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="text-label">{f.label}</span>
                    <span className="tabular-nums text-label-2">
                      {f.filled}/{f.total}
                    </span>
                  </div>
                  <ProgressBar value={f.total ? f.filled / f.total : 0} tone="green" label={`${f.label} filled`} />
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Records by program">
            <ul className="flex flex-col gap-3 p-4">
              {q.byProgram.map((b) => {
                const p = PROGRAMS.find((x) => x.id === b.programId)!;
                const total = b.approved + b.drafts;
                return (
                  <li key={b.programId}>
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span className="inline-flex items-center gap-1.5 text-label">
                        <ProgramDot color={p.color} />
                        {p.name}
                      </span>
                      <span className="tabular-nums text-label-2">
                        {b.approved} approved · {b.drafts} draft
                      </span>
                    </div>
                    <ProgressBar value={total / maxProgram} label={`${p.name} records`} />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  target,
  met,
  help,
}: {
  label: string;
  value: string;
  target: string;
  met: boolean | null;
  help: string;
}) {
  return (
    <div className="rounded-xl border border-separator bg-surface px-4 py-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium text-label-2">{label}</p>
        {met === true && <Badge tone="green">Met</Badge>}
        {met === false && <Badge tone="orange">Below</Badge>}
      </div>
      <p className="mt-0.5 text-[24px] font-semibold tabular-nums tracking-[-0.01em] text-label">{value}</p>
      <p className="text-[12px] font-medium text-label-2">{target}</p>
      <p className="mt-1 text-[12px] text-label-3">{help}</p>
    </div>
  );
}
