import { Icon, cx } from "./ui";

export const STEPS = ["Program", "Template", "Case information", "Review", "Approved"] as const;

/** Shows where the user is in Select → Enter → Standardize → Review → Approve. */
export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-1" aria-current={active ? "step" : undefined}>
            <span
              className={cx(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
                active && "bg-accent text-white",
                done && "bg-accent-soft text-accent-text",
                !active && !done && "bg-fill text-label-2",
              )}
            >
              {done ? (
                <Icon name="check" className="size-3.5" />
              ) : (
                <span className="tabular-nums">{i + 1}</span>
              )}
              {label}
              {done && <span className="sr-only"> (done)</span>}
            </span>
            {i < STEPS.length - 1 && <Icon name="chevronRight" className="size-3 text-label-3" />}
          </li>
        );
      })}
    </ol>
  );
}
