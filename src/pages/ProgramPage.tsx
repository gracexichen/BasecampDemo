import { Link, useParams } from "react-router";
import { TEMPLATES, getProgram } from "../../shared/programs";
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
} from "../components/ui";
import { api } from "../lib/api";
import { useAppState } from "../lib/app-state";
import { formatDate, recordTitle } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import { NotFound } from "./NotFound";

export function ProgramPage() {
  const { programId = "" } = useParams();
  const program = getProgram(programId);
  const { dataVersion } = useAppState();
  const { data, loading } = useAsync(() => api.records(), [dataVersion]);
  if (!program) return <NotFound />;
  const templates = TEMPLATES.filter((t) => t.programId === program.id);
  const records = (data ?? []).filter((r) => r.programId === program.id);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <ProgramDot color={program.color} className="size-3.5" />
            {program.name}
          </span>
        }
        subtitle={`${program.description} Illustrative program for the prototype.`}
        actions={
          <ButtonLink to={`/new?program=${program.id}&template=${program.id}-visit-note`} variant="primary" icon="compose">
            New Case / Visit Note
          </ButtonLink>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Templates">
          <ul className="divide-y divide-separator">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <Icon name="template" className="text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-label">{t.name}</p>
                  <p className="text-[12px] text-label-2">{t.description}</p>
                </div>
                {t.status === "active" ? (
                  <ButtonLink to={`/new?program=${program.id}&template=${t.id}`}>Use</ButtonLink>
                ) : (
                  <Badge>Planned</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Records" description={`${records.length} in this program`}>
          {loading && !data ? (
            <LoadingState />
          ) : records.length === 0 ? (
            <EmptyState title="No records yet">Start a case note for this program.</EmptyState>
          ) : (
            <ul className="divide-y divide-separator">
              {records.map((r) => (
                <li key={r.id}>
                  <Link
                    to={r.status === "draft" ? `/records/${r.id}/review` : `/records/${r.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-label">{recordTitle(r)}</p>
                      <p className="text-[12px] text-label-3">
                        Visit {formatDate(r.fields.visit_date?.value)} · {r.fields.staff_name?.value || "Staff not stated"}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                    <Icon name="chevronRight" className="size-3.5 text-label-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
