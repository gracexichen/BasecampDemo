import { getProgram, getTemplate } from "../../shared/programs";
import type { CaseRecord } from "../../shared/schemas";

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function percent(x: number | null | undefined): string {
  return x == null ? "—" : `${Math.round(x * 100)}%`;
}

export function money(x: number | null | undefined): string {
  if (x == null) return "—";
  return x < 0.1 ? `${(x * 100).toFixed(1)}¢` : `$${x.toFixed(2)}`;
}

export function recordTitle(r: CaseRecord): string {
  return r.fields.client_id?.value || "Untitled record";
}

export function programName(id: string): string {
  return getProgram(id)?.name ?? id;
}

export function templateLabel(id: string): string {
  return getTemplate(id)?.documentType ?? id;
}
