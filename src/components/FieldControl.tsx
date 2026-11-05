import type { FieldDef, FieldEntry, Issue } from "../../shared/schemas";
import { Badge, Button, Icon, cx } from "./ui";

const INPUT =
  "block w-full rounded-lg border bg-surface px-3 text-[14px] text-label placeholder:text-label-3 focus:border-accent focus:outline-none focus-visible:outline-[3px] focus-visible:outline-offset-0 disabled:bg-surface-2 disabled:text-label-2";

export function fieldStatus(def: FieldDef, entry: FieldEntry, issues: Issue[]) {
  const value = entry.value.trim();
  if (issues.some((i) => i.severity === "error" && i.code === "missing_required"))
    return <Badge tone="red" icon="warning">Missing</Badge>;
  if (issues.some((i) => i.severity === "error")) return <Badge tone="red" icon="warning">Check value</Badge>;
  if (!value && entry.notStatedConfirmed) return <Badge>Not stated (confirmed)</Badge>;
  if (!value) return <Badge>Not stated</Badge>;
  if (issues.some((i) => i.code === "ungrounded")) return <Badge tone="orange" icon="warning">Check quote</Badge>;
  if (entry.origin === "staff")
    return (
      <Badge tone="blue" icon="pencil">
        {entry.aiStatus === "stated" ? "Edited by staff" : "Added by staff"}
      </Badge>
    );
  if (def.required || value) return <Badge tone="accent" icon="sparkles">From note</Badge>;
  return null;
}

/** Recompute origin when staff edit a value. */
export function editEntry(entry: FieldEntry, value: string): FieldEntry {
  const same = entry.aiStatus === "stated" && value.trim() === entry.aiValue.trim();
  return {
    ...entry,
    value,
    origin: same ? "ai" : value.trim() ? "staff" : "empty",
    notStatedConfirmed: value.trim() ? false : entry.notStatedConfirmed,
  };
}

export function FieldControl({
  def,
  entry,
  issues,
  readOnly,
  onChange,
  onFocus,
  onConfirmNotStated,
}: {
  def: FieldDef;
  entry: FieldEntry;
  issues: Issue[];
  readOnly?: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onConfirmNotStated: (confirmed: boolean) => void;
}) {
  const id = `field-${def.key}`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const hasError = issues.some((i) => i.severity === "error");
  const borderClass = hasError ? "border-red" : "border-separator-strong";
  const describedBy = [helpId, hasError ? errorId : null].filter(Boolean).join(" ");
  const common = {
    id,
    disabled: readOnly,
    onFocus,
    "aria-invalid": hasError || undefined,
    "aria-describedby": describedBy,
    "aria-required": def.required || undefined,
  };
  const missing = issues.some((i) => i.code === "missing_required");

  return (
    <div
      className={cx("rounded-lg px-3 py-2.5 -mx-3", hasError && "bg-red-soft/60")}
      onMouseEnter={onFocus}
      data-field={def.key}
    >
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-semibold text-label">
          {def.label}
          {def.required && (
            <span className="ml-0.5 text-red" aria-hidden="true">
              *
            </span>
          )}
          {def.required && <span className="sr-only"> (required)</span>}
        </label>
        {fieldStatus(def, entry, issues)}
      </div>

      {def.type === "text" && (
        <input
          {...common}
          type="text"
          value={entry.value}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cx(INPUT, borderClass, "h-9")}
        />
      )}
      {def.type === "date" && (
        <input
          {...common}
          type="date"
          value={entry.value}
          onChange={(e) => onChange(e.target.value)}
          className={cx(INPUT, borderClass, "h-9 max-w-[220px]")}
        />
      )}
      {def.type === "select" && (
        <select
          {...common}
          value={entry.value}
          onChange={(e) => onChange(e.target.value)}
          className={cx(INPUT, borderClass, "h-9 max-w-[360px] appearance-auto")}
        >
          <option value="">Not selected</option>
          {def.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          {entry.value && !def.options?.includes(entry.value) && <option value={entry.value}>{entry.value}</option>}
        </select>
      )}
      {(def.type === "longtext" || def.type === "list") && (
        <textarea
          {...common}
          value={entry.value}
          rows={def.type === "list" ? Math.max(2, entry.value.split("\n").length) : 3}
          onChange={(e) => onChange(e.target.value)}
          className={cx(INPUT, borderClass, "resize-y py-2 leading-relaxed")}
        />
      )}

      <p id={helpId} className="mt-1 text-[12px] text-label-3">
        {def.help}
      </p>

      {entry.evidence && entry.value.trim() && (
        <p className="mt-1 flex gap-1 text-[12px] text-label-2">
          <Icon name="doc" className="mt-px size-3.5 text-label-3" />
          <span>
            From note: <q className="italic">{entry.evidence}</q>
          </span>
        </p>
      )}

      {issues.map((i) => (
        <p
          key={i.code}
          id={i.severity === "error" ? errorId : undefined}
          className={cx("mt-1 flex gap-1 text-[12px] font-medium", i.severity === "error" ? "text-red" : "text-orange")}
        >
          <Icon name="warning" className="mt-px size-3.5" />
          {i.message}
        </p>
      ))}

      {!readOnly && def.required && !entry.value.trim() && (
        <div className="mt-1.5">
          {missing ? (
            <Button variant="plain" className="-ml-3 h-7" onClick={() => onConfirmNotStated(true)}>
              Confirm it's not stated in the note
            </Button>
          ) : entry.notStatedConfirmed ? (
            <Button variant="plain" className="-ml-3 h-7" onClick={() => onConfirmNotStated(false)}>
              Undo "not stated"
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
