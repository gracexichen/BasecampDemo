import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
  Segmented,
  StatusBadge,
} from "../components/ui";
import { api } from "../lib/api";
import { useAppState } from "../lib/app-state";
import { formatDate, formatDateTime, programName } from "../lib/format";
import { useAsync } from "../lib/useAsync";

type StatusFilter = "all" | "approved" | "draft";

export function Records() {
  const { dataVersion } = useAppState();
  const { data, loading, error } = useAsync(() => api.records(), [dataVersion]);
  const [program, setProgram] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => program === "all" || r.programId === program)
      .filter((r) => status === "all" || r.status === status)
      .filter(
        (r) =>
          !q ||
          Object.values(r.fields).some((f) => f.value.toLowerCase().includes(q)) ||
          r.sourceText.toLowerCase().includes(q),
      );
  }, [data, program, status, query]);

  const open = (id: string, s: string) => navigate(s === "draft" ? `/records/${id}/review` : `/records/${id}`);

  return (
    <>
      <PageHeader
        title="Saved Records"
        subtitle="Every approved note and draft in one place, in the same standard format."
        actions={
          <ButtonLink to="/new" variant="primary" icon="compose">
            New Case Note
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-label-3" />
          <label htmlFor="record-search" className="sr-only">
            Search records
          </label>
          <input
            id="record-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client ID, staff, text…"
            className="h-8 w-[260px] rounded-lg border border-separator-strong bg-surface pr-3 pl-8 text-[13px] text-label placeholder:text-label-3 focus:border-accent focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-[13px] text-label-2">
          Program
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="h-8 w-56 rounded-lg border border-separator-strong bg-surface px-2 text-[13px] text-label"
          >
            <option value="all">All programs</option>
            {PROGRAMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <Segmented<StatusFilter>
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "approved", label: "Approved" },
            { value: "draft", label: "Drafts" },
          ]}
        />
      </div>

      <Card>
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <EmptyState icon="warning" title="Couldn't load records">
            {error}
          </EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState title={data?.length ? "No matching records" : "No records yet"}>
            {data?.length ? "Try a different search or filter." : "Approved and draft notes will appear here."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Saved case records</caption>
              <thead>
                <tr className="border-b border-separator text-[12px] text-label-2">
                  <th scope="col" className="px-4 py-2.5 font-medium">Client ID</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Program</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Visit date</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Staff</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Required fields</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Updated</th>
                  <th scope="col" className="px-4 py-2.5"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {rows.map((r) => {
                  const t = getTemplate(r.templateId);
                  const v = t ? validateRecord(t, r.fields, r.sourceText) : null;
                  const p = PROGRAMS.find((x) => x.id === r.programId);
                  const done = v ? v.requiredFilled + v.requiredConfirmedNotStated : 0;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => open(r.id, r.status)}
                      className="cursor-pointer hover:bg-surface-2"
                    >
                      <td className="px-4 py-3 font-semibold text-label">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            open(r.id, r.status);
                          }}
                          className="hover:underline"
                          aria-label={`Open record ${r.fields.client_id?.value || r.id}`}
                        >
                          {r.fields.client_id?.value || "—"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-label">
                        <span className="inline-flex items-center gap-1.5">
                          <ProgramDot color={p?.color ?? "#999"} />
                          {programName(r.programId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-label tabular-nums">{formatDate(r.fields.visit_date?.value)}</td>
                      <td className="px-4 py-3 text-label">{r.fields.staff_name?.value || "—"}</td>
                      <td className="px-4 py-3">
                        {v &&
                          (done === v.requiredTotal ? (
                            <span className="tabular-nums text-label-2">
                              {done}/{v.requiredTotal}
                            </span>
                          ) : (
                            <Badge tone="red" icon="warning">
                              {done}/{v.requiredTotal}
                            </Badge>
                          ))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-label-2 tabular-nums">{formatDateTime(r.updatedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Icon name="chevronRight" className="inline size-3.5 text-label-3" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-[12px] text-label-3">
        Stored locally on this computer in a SQLite demo database. All records are synthetic.
      </p>
    </>
  );
}
