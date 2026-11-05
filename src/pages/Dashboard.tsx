import { Link } from "react-router";
import { PROGRAMS, getTemplate } from "../../shared/programs";
import { validateRecord } from "../../shared/validation";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  Icon,
  LoadingState,
  PageHeader,
  ProgramDot,
  StatusBadge,
  cx,
  type IconName,
} from "../components/ui";
import { api } from "../lib/api";
import { useAppState } from "../lib/app-state";
import { formatDate, formatDateTime, percent, programName, recordTitle } from "../lib/format";
import { useAsync } from "../lib/useAsync";

const HOW_IT_WORKS: { icon: IconName; title: string; text: string }[] = [
  { icon: "template", title: "Pick a standard template", text: "Every program uses the same Case / Visit Note fields." },
  { icon: "sparkles", title: "Claude structures the note", text: "It fills only what the note says and quotes its source." },
  { icon: "warning", title: "Gaps are flagged", text: "Missing required fields are marked, never guessed." },
  { icon: "person", title: "Staff review and approve", text: "Nothing is saved as final until a person approves it." },
];

export function Dashboard() {
  const { dataVersion, effectiveMode } = useAppState();
  const records = useAsync(() => api.records(), [dataVersion]);
  const quality = useAsync(() => api.quality(), [dataVersion]);

  const totals = quality.data?.totals;
  const recent = records.data?.slice(0, 3) ?? [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="One shared way to document visits across every program."
        actions={
          <ButtonLink to="/new?program=housing&template=housing-visit-note&sample=housing-eviction-notice" variant="primary" icon="compose">
            Start panel demo
          </ButtonLink>
        }
      />

      {/* Record numbers, grouped in one strip */}
      <section
        aria-label="Record totals"
        className="mb-4 grid grid-cols-2 divide-separator rounded-xl border border-separator bg-surface shadow-card sm:grid-cols-4 sm:divide-x"
      >
        <Stat label="Saved records" value={totals?.records} />
        <Stat label="Approved" value={totals?.approved} />
        <Stat label="Drafts to finish" value={totals?.drafts} tone={totals?.drafts ? "orange" : undefined} />
        <Stat
          label="Complete approved notes"
          value={quality.data ? percent(quality.data.completeRate) : undefined}
          hint="Target: 4 of 5"
        />
      </section>

      <section aria-labelledby="start-heading" className="mb-4">
        <h2 id="start-heading" className="mb-3 text-[15px] font-semibold text-label">
          Start a case note
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {PROGRAMS.map((p) => {
            const count = records.data?.filter((r) => r.programId === p.id).length ?? 0;
            return (
              <Link
                key={p.id}
                to={`/new?program=${p.id}&template=${p.id}-visit-note`}
                className="group flex flex-col rounded-xl border border-separator bg-surface p-4 shadow-card transition-colors hover:border-separator-strong hover:bg-surface-2"
                aria-label={`Start a ${p.name} case note`}
              >
                <div className="flex items-center gap-2">
                  <ProgramDot color={p.color} />
                  <span className="text-[14px] font-semibold text-label">{p.name}</span>
                </div>
                <p className="mt-1.5 flex-1 text-[13px] text-label-2">{p.description}</p>
                <div className="mt-3 flex items-center justify-between text-[12px] text-label-3">
                  <span>
                    {count} record{count === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-0.5 font-medium text-accent-text">
                    New note <Icon name="chevronRight" className="size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Card
        className="mb-4"
        title="Recent records"
        actions={
          <Link to="/records" className="text-[13px] font-medium text-accent-text hover:underline">
            See all
          </Link>
        }
      >
        {records.loading && !records.data ? (
          <LoadingState />
        ) : recent.length === 0 ? (
          <EmptyState title="No records yet">Start a case note to create the first record.</EmptyState>
        ) : (
          <ul className="divide-y divide-separator">
            {recent.map((r) => {
              const t = getTemplate(r.templateId);
              const v = t ? validateRecord(t, r.fields, r.sourceText) : null;
              const program = PROGRAMS.find((p) => p.id === r.programId);
              return (
                <li key={r.id}>
                  <Link
                    to={r.status === "draft" ? `/records/${r.id}/review` : `/records/${r.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2"
                  >
                    <ProgramDot color={program?.color ?? "#999"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-label">
                        {recordTitle(r)} <span className="font-normal text-label-2">· {programName(r.programId)}</span>
                      </p>
                      <p className="text-[12px] text-label-3">
                        Visit {formatDate(r.fields.visit_date?.value)} · Updated {formatDateTime(r.updatedAt)}
                      </p>
                    </div>
                    {v && r.status === "draft" && v.issues.some((i) => i.severity === "error") && (
                      <Badge tone="red" icon="warning">
                        Needs info
                      </Badge>
                    )}
                    <StatusBadge status={r.status} />
                    <Icon name="chevronRight" className="size-3.5 text-label-3" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* How it works: collapsed by default */}
      <details className="group rounded-xl border border-separator bg-surface shadow-card">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 select-none [&::-webkit-details-marker]:hidden">
          <Icon name="chevronRight" className="size-3.5 text-label-3 transition-transform group-open:rotate-90" />
          <span className="text-[15px] font-semibold text-label">How it works</span>
          <span className="ml-auto text-[12px] text-label-3">
            {effectiveMode === "live" ? "Live Claude extraction is on" : "Offline demo mode"}
          </span>
        </summary>
        <ol className="grid gap-3 border-t border-separator p-4 sm:grid-cols-2">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
                <Icon name={s.icon} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-label">
                  {i + 1}. {s.title}
                </p>
                <p className="text-[13px] text-label-2">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </details>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string | undefined;
  hint?: string;
  tone?: "orange";
}) {
  return (
    <div className="px-4 py-2.5">
      <p className="text-[12px] font-medium text-label-2">{label}</p>
      <p className="flex items-baseline gap-2">
        <span className={cx("text-[20px] font-semibold tabular-nums tracking-[-0.01em]", tone === "orange" ? "text-orange" : "text-label")}>
          {value ?? "—"}
        </span>
        {hint && <span className="text-[12px] text-label-3">{hint}</span>}
      </p>
    </div>
  );
}
