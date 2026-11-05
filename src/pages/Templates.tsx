import { useState } from "react";
import { PROGRAMS, TEMPLATES, getProgram, sections } from "../../shared/programs";
import { Badge, ButtonLink, Card, EmptyState, Icon, PageHeader, ProgramDot, cx } from "../components/ui";

const TYPE_LABELS = {
  text: "Short text",
  longtext: "Paragraph",
  date: "Date",
  select: "Choice",
  list: "List",
} as const;

export function Templates() {
  const [selectedId, setSelectedId] = useState(TEMPLATES[0].id);
  const selected = TEMPLATES.find((t) => t.id === selectedId)!;
  const program = getProgram(selected.programId)!;

  return (
    <>
      <PageHeader
        title="Templates"
        subtitle="Approved, standardized templates. Everyone in a program documents the same fields in the same way."
      />
      <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card as="div" className="overflow-hidden">
          <div role="listbox" aria-label="Templates" className="flex flex-col py-1">
            {PROGRAMS.map((p) => (
              <div key={p.id} role="group" aria-label={p.name}>
                <p className="flex items-center gap-1.5 px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-label-3">
                  <ProgramDot color={p.color} className="size-2" />
                  {p.name}
                </p>
                {TEMPLATES.filter((t) => t.programId === p.id).map((t) => {
                  const active = t.id === selectedId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSelectedId(t.id)}
                      className={cx(
                        "mx-2 flex w-[calc(100%-1rem)] items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px]",
                        active ? "bg-accent text-white" : "text-label hover:bg-fill",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon name="template" className={active ? "text-white" : "text-accent"} />
                        {t.name}
                      </span>
                      {t.status === "planned" ? (
                        <span className={cx("text-[11px]", active ? "text-white/80" : "text-label-3")}>Planned</span>
                      ) : (
                        <span className={cx("text-[11px] tabular-nums", active ? "text-white/80" : "text-label-3")}>
                          v{t.version}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        <Card
          title={
            <span className="flex flex-wrap items-center gap-2">
              {selected.name}
              {selected.status === "active" ? <Badge tone="green">Active</Badge> : <Badge>Planned · Walk phase</Badge>}
            </span>
          }
          description={
            <span className="inline-flex items-center gap-1.5">
              <ProgramDot color={program.color} />
              {program.name} · {selected.description}
            </span>
          }
          actions={
            selected.status === "active" && (
              <ButtonLink to={`/new?program=${selected.programId}&template=${selected.id}`} variant="primary" icon="compose">
                Use template
              </ButtonLink>
            )
          }
        >
          {selected.status === "planned" ? (
            <EmptyState icon="template" title="Not available yet">
              The prototype supports the Case / Visit Note first. Follow-up notes are planned once staff agree on the
              first template's fields.
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-5 p-4">
              {sections(selected).map((s) => (
                <div key={s.name}>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-label-3">{s.name}</p>
                  <div className="overflow-hidden rounded-lg border border-separator">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-surface-2 text-[12px] text-label-2">
                        <tr>
                          <th scope="col" className="px-3 py-2 font-medium">Field</th>
                          <th scope="col" className="px-3 py-2 font-medium">Type</th>
                          <th scope="col" className="px-3 py-2 font-medium">Required</th>
                          <th scope="col" className="px-3 py-2 font-medium">Guidance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-separator">
                        {s.fields.map((f) => (
                          <tr key={f.key}>
                            <td className="px-3 py-2 font-medium text-label">{f.label}</td>
                            <td className="px-3 py-2 text-label-2">{TYPE_LABELS[f.type]}</td>
                            <td className="px-3 py-2">
                              {f.required ? <Badge tone="accent">Required</Badge> : <span className="text-label-3">Optional</span>}
                            </td>
                            <td className="px-3 py-2 text-label-2">
                              {f.help}
                              {f.options && <span className="mt-0.5 block text-[12px] text-label-3">Options: {f.options.join(" · ")}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <p className="text-[12px] text-label-3">
                Field list is a starting draft for the prototype. The real required fields still need to be confirmed with
                El Sol staff and a CHW supervisor.
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
