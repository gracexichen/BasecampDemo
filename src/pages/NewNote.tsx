import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { PROGRAMS, TEMPLATES, getProgram, getTemplate, sections } from "../../shared/programs";
import { SAMPLE_NOTES } from "../../shared/samples";
import { entriesFromExtraction } from "../../shared/validation";
import { StepIndicator } from "../components/StepIndicator";
import {
  Badge,
  Button,
  Callout,
  Card,
  Icon,
  PageHeader,
  ProgramDot,
  Segmented,
  Spinner,
  cx,
} from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAppState } from "../lib/app-state";
import type { ExtractionMode, FieldDef, FieldEntry } from "../../shared/schemas";

export function NewNote() {
  const [params, setParams] = useSearchParams();
  const program = getProgram(params.get("program") ?? "");
  const template = getTemplate(params.get("template") ?? "");
  const validTemplate = template && program && template.programId === program.id && template.status === "active";

  const choose = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    setParams(p);
  };

  if (!program) return <ChooseProgram onChoose={(id) => choose({ program: id, template: null })} />;
  if (!validTemplate)
    return (
      <ChooseTemplate
        programId={program.id}
        onChoose={(id) => choose({ template: id })}
        onBack={() => choose({ program: null, template: null })}
      />
    );
  return (
    <Editor
      key={template.id}
      templateId={template.id}
      suggestedSample={params.get("sample")}
      onBack={() => choose({ template: null, sample: null })}
    />
  );
}

/* ------------------------------------------------------------------ */

function ChooseProgram({ onChoose }: { onChoose: (id: string) => void }) {
  return (
    <>
      <PageHeader title="New Case Note" subtitle="Choose the program this contact belongs to." />
      <StepIndicator current={0} />
      <div className="grid gap-3 md:grid-cols-3" role="list">
        {PROGRAMS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="listitem"
            onClick={() => onChoose(p.id)}
            className="flex flex-col rounded-xl border border-separator bg-surface p-4 text-left shadow-card transition-colors hover:border-separator-strong hover:bg-surface-2"
          >
            <span className="flex items-center gap-2 text-[15px] font-semibold text-label">
              <ProgramDot color={p.color} />
              {p.name}
            </span>
            <span className="mt-1.5 text-[13px] text-label-2">{p.description}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-label-3">
        These three programs are illustrative and are not El Sol's confirmed program names.
      </p>
    </>
  );
}

function ChooseTemplate({
  programId,
  onChoose,
  onBack,
}: {
  programId: string;
  onChoose: (id: string) => void;
  onBack: () => void;
}) {
  const program = getProgram(programId)!;
  const templates = TEMPLATES.filter((t) => t.programId === programId);
  return (
    <>
      <PageHeader
        title="New Case Note"
        subtitle={
          <>
            Choose a standardized template for <strong className="text-label">{program.name}</strong>.
          </>
        }
      />
      <StepIndicator current={1} />
      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((t) => {
          const required = t.fields.filter((f) => f.required).length;
          const planned = t.status === "planned";
          return (
            <button
              key={t.id}
              type="button"
              disabled={planned}
              onClick={() => onChoose(t.id)}
              className={cx(
                "flex flex-col rounded-xl border border-separator bg-surface p-4 text-left shadow-card transition-colors",
                planned ? "cursor-not-allowed opacity-60" : "hover:border-separator-strong hover:bg-surface-2",
              )}
            >
              <span className="flex items-center gap-2">
                <Icon name="template" className="text-accent" />
                <span className="text-[15px] font-semibold text-label">{t.name}</span>
                {planned ? <Badge>Planned</Badge> : <Badge tone="accent">v{t.version}</Badge>}
              </span>
              <span className="mt-1.5 text-[13px] text-label-2">{t.description}</span>
              {!planned && (
                <span className="mt-2 text-[12px] text-label-3">
                  {t.fields.length} fields · {required} required
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-5">
        <Button variant="plain" icon="chevronLeft" onClick={onBack}>
          Choose a different program
        </Button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Editor({
  templateId,
  suggestedSample,
  onBack,
}: {
  templateId: string;
  suggestedSample: string | null;
  onBack: () => void;
}) {
  const template = getTemplate(templateId)!;
  const program = getProgram(template.programId)!;
  const navigate = useNavigate();
  const { config, mode, setMode, effectiveMode, toast } = useAppState();
  const [text, setText] = useState("");
  const [loadedSample, setLoadedSample] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const samples = SAMPLE_NOTES.filter((s) => s.templateId === template.id && s.showInEditor);
  const tooShort = text.trim().length < 20;
  const [values, setValues] = useState<Record<string, string>>(() => ({
    visit_date: new Date().toISOString().slice(0, 10),
  }));
  const [pasteOpen, setPasteOpen] = useState(false);
  const hasInput = Object.entries(values).some(([k, v]) => k !== "visit_date" && v.trim());

  async function submitForm() {
    if (!hasInput || busy) return;
    setBusy(true);
    setError(null);
    try {
      const entries: Record<string, FieldEntry> = {};
      for (const f of template.fields) {
        const v = (values[f.key] ?? "").trim();
        entries[f.key] = {
          value: v,
          origin: v ? "staff" : "empty",
          aiValue: "",
          aiStatus: "not_stated",
          evidence: "",
          notStatedConfirmed: false,
        };
      }
      const sourceText = template.fields
        .filter((f) => entries[f.key].value)
        .map((f) => `${f.label}: ${entries[f.key].value.replace(/\n/g, "; ")}`)
        .join("\n");
      const record = await api.createRecord({ templateId: template.id, sourceText, fields: entries, extraction: null });
      toast("Note saved as a draft. Review it before approving.", "info");
      navigate(`/records/${record.id}/review`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function standardize(useMode: ExtractionMode) {
    if (tooShort || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.extract({ templateId: template.id, sourceText: text, mode: useMode });
      const record = await api.createRecord({
        templateId: template.id,
        sourceText: text,
        fields: entriesFromExtraction(template, result.fields),
        extraction: result.meta,
      });
      toast(useMode === "live" ? "Claude standardized the note. Review it before approving." : "Offline demo result ready. Review it before approving.", "info");
      navigate(`/records/${record.id}/review`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const live = effectiveMode === "live";

  return (
    <>
      <PageHeader
        title="New Case Note"
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <ProgramDot color={program.color} />
            {program.name} · {template.documentType} v{template.version}
          </span>
        }
      />
      <StepIndicator current={2} />

      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Card title="Case note" description="Pick from the lists and fill in the blanks. Required fields are marked *.">
          <div className="flex flex-col gap-5 p-4">
            {sections(template).map((sec) => (
              <fieldset key={sec.name} className="flex flex-col gap-3">
                <legend className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-label-3">
                  {sec.name}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {sec.fields.map((f) => (
                    <SimpleField
                      key={f.key}
                      def={f}
                      value={values[f.key] ?? ""}
                      onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                    />
                  ))}
                </div>
              </fieldset>
            ))}
            <p className="text-[12px] text-label-3">Use synthetic information only. Do not enter real client data.</p>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-separator px-4 py-3">
            <Button variant="plain" onClick={onBack}>
              Change template
            </Button>
            <Button variant="primary" size="lg" disabled={!hasInput || busy} onClick={() => void submitForm()}>
              {busy && !pasteOpen && <Spinner className="text-white" />}
              Continue to review
            </Button>
          </div>
          {error && !pasteOpen && (
            <div className="px-4 pb-4">
              <Callout tone="red" icon="warning" title="The note was not saved.">
                <p>{error}</p>
              </Callout>
            </div>
          )}
        </Card>

        <details
          className="rounded-xl border border-separator bg-surface shadow-card"
          open={pasteOpen}
          onToggle={(e) => setPasteOpen((e.currentTarget as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer px-4 py-3 text-[14px] font-semibold text-label">
            Already have a written note? Paste it and let Claude fill in the form
          </summary>
        <Card
          title="Case information"
          description="Type or paste what happened during the contact, in any format."
          actions={
            samples.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1.5">
                {samples.map((s) => (
                  <Button
                    key={s.id}
                    variant={s.id === suggestedSample && !loadedSample ? "primary" : "secondary"}
                    icon="doc"
                    onClick={() => {
                      setText(s.text);
                      setLoadedSample(s.id);
                      setError(null);
                    }}
                    title={s.description}
                  >
                    Load sample note
                  </Button>
                ))}
              </div>
            )
          }
        >
          <div className="p-4">
            <label htmlFor="case-text" className="sr-only">
              Case information
            </label>
            <textarea
              id="case-text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setLoadedSample(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void standardize(effectiveMode);
              }}
              rows={16}
              placeholder="Example: 11/04/2026 phone call with client H-1234. Discussed rent due on the 1st…"
              className="block w-full resize-y rounded-lg border border-separator-strong bg-surface-2 px-3 py-2.5 font-sans text-[14px] leading-relaxed text-label placeholder:text-label-3 focus:border-accent focus:outline-none focus-visible:outline-[3px] focus-visible:outline-offset-0"
              aria-describedby="case-text-help"
            />
            <div id="case-text-help" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-label-3">
              <span>
                {loadedSample ? (
                  <Badge tone="accent" icon="doc">
                    Synthetic sample: {SAMPLE_NOTES.find((s) => s.id === loadedSample)?.title}
                  </Badge>
                ) : (
                  "Use synthetic information only. Do not enter real client data."
                )}
              </span>
              <span className="tabular-nums">{text.length.toLocaleString()} characters</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-label-2" id="mode-label">
                Extraction
              </span>
              <Segmented<ExtractionMode>
                label="Extraction mode"
                value={live ? "live" : "offline"}
                onChange={setMode}
                options={[
                  { value: "live", label: "Live Claude", disabled: !config?.liveAvailable },
                  { value: "offline", label: "Offline demo" },
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="plain" onClick={onBack}>
                Change template
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon={busy ? undefined : "sparkles"}
                disabled={tooShort || busy}
                onClick={() => void standardize(effectiveMode)}
                aria-keyshortcuts="Meta+Enter"
              >
                {busy && <Spinner className="text-white" />}
                {busy ? (live ? "Claude is reading…" : "Standardizing…") : live ? "Standardize with Claude" : "Standardize (offline demo)"}
              </Button>
            </div>
          </div>

          {!live && (
            <div className="px-4 pb-4">
              <Callout tone="orange" icon="bolt" title="Offline demo mode: Claude is not being called.">
                {config && !config.liveAvailable
                  ? "No Anthropic API key is set up on this computer. "
                  : mode === "offline"
                    ? "You chose Offline demo. "
                    : ""}
                Sample notes use pre-written results; other text gets simple pattern matching. Results are labeled
                as offline everywhere they appear.
              </Callout>
            </div>
          )}

          {error && (
            <div className="px-4 pb-4">
              <Callout tone="red" icon="warning" title="The note was not standardized.">
                <p>{error}</p>
                {live && (
                  <Button className="mt-2" onClick={() => void standardize("offline")}>
                    Try Offline demo instead
                  </Button>
                )}
              </Callout>
            </div>
          )}
        </Card>

        </details>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

const FIELD_BASE =
  "block w-full rounded-lg border border-separator-strong bg-surface px-3 text-[14px] text-label placeholder:text-label-3 focus:border-accent focus:outline-none focus-visible:outline-[3px] focus-visible:outline-offset-0";

function SimpleField({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  const id = `new-${def.key}`;
  const wide = def.type === "longtext" || def.type === "list";
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-1 block text-[13px] font-semibold text-label">
        {def.label}
        {def.required && (
          <span className="ml-0.5 text-red" aria-hidden="true">
            *
          </span>
        )}
        {def.required && <span className="sr-only"> (required)</span>}
      </label>
      {def.type === "select" ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cx(FIELD_BASE, "h-9")}>
          <option value="">Select…</option>
          {def.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : def.type === "date" ? (
        <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className={cx(FIELD_BASE, "h-9")} />
      ) : wide ? (
        <textarea
          id={id}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cx(FIELD_BASE, "resize-y py-2 leading-relaxed")}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cx(FIELD_BASE, "h-9")}
        />
      )}
      <p className="mt-1 text-[12px] text-label-3">{def.help}</p>
    </div>
  );
}
