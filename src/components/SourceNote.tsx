import type { ReactNode } from "react";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Find the evidence quote in the note, ignoring case and spacing differences. */
export function findEvidence(text: string, evidence: string): { start: number; end: number } | null {
  const words = evidence.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const re = new RegExp(words.map(escapeRegExp).join("\\s+"), "i");
  const m = re.exec(text);
  return m ? { start: m.index, end: m.index + m[0].length } : null;
}

/** The original note, with the quote for the active field highlighted. */
export function SourceNote({ text, evidence, label }: { text: string; evidence?: string; label?: string }) {
  const hit = evidence ? findEvidence(text, evidence) : null;
  let content: ReactNode = text;
  if (hit) {
    content = (
      <>
        {text.slice(0, hit.start)}
        <mark className="evidence" aria-label={label ? `Quote supporting ${label}` : undefined}>
          {text.slice(hit.start, hit.end)}
        </mark>
        {text.slice(hit.end)}
      </>
    );
  }
  return (
    <div className="whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-label">{content}</div>
  );
}
