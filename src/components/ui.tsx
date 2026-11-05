import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";

export function cx(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Icons: simple line glyphs in the spirit of SF Symbols                */
/* ------------------------------------------------------------------ */

const PATHS: Record<string, ReactNode> = {
  home: <path d="M3.5 9.5 10 4l6.5 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-4V17H4.5a1 1 0 0 1-1-1V9.5Z" />,
  compose: (
    <>
      <path d="M15.5 10.5V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1h5.5" />
      <path d="M14.2 3.3a1.4 1.4 0 0 1 2 2L10 11.5l-2.6.6.6-2.6 6.2-6.2Z" />
    </>
  ),
  tray: (
    <>
      <path d="M3 11.5 5 4.5h10l2 7V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.5Z" />
      <path d="M3 11.5h4.2a2.8 2.8 0 0 0 5.6 0H17" />
    </>
  ),
  template: (
    <>
      <rect x="4" y="3" width="12" height="14" rx="1.5" />
      <path d="M7 7h6M7 10h6M7 13h3.5" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 16.5h13" />
      <rect x="5" y="10" width="2.4" height="5" rx=".6" />
      <rect x="8.8" y="6" width="2.4" height="9" rx=".6" />
      <rect x="12.6" y="8" width="2.4" height="7" rx=".6" />
    </>
  ),
  gear: (
    <>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.8v2M10 15.2v2M2.8 10h2M15.2 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4" />
    </>
  ),
  sparkles: (
    <>
      <path d="M9 3.5 10.3 7.7 14.5 9 10.3 10.3 9 14.5 7.7 10.3 3.5 9 7.7 7.7 9 3.5Z" />
      <path d="M15 12.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9Z" />
    </>
  ),
  check: <path d="m5 10.5 3.2 3.2L15 6.8" />,
  checkCircle: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="m7 10.2 2.1 2.1L13.2 8" />
    </>
  ),
  warning: (
    <>
      <path d="M10 3.5 17 16H3l7-12.5Z" />
      <path d="M10 8.5v3.2M10 13.8v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 9v4.5M10 6.6v.1" />
    </>
  ),
  chevronRight: <path d="m8 5 5 5-5 5" />,
  chevronLeft: <path d="m12 5-5 5 5 5" />,
  download: (
    <>
      <path d="M10 3.5v9M6.5 9 10 12.5 13.5 9" />
      <path d="M4 14.5v1.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1.5" />
    </>
  ),
  arrowCounter: (
    <>
      <path d="M4.5 9.5a5.5 5.5 0 1 1 1.6 4.4" />
      <path d="M4 5.5v4h4" />
    </>
  ),
  doc: (
    <>
      <path d="M5 3h6.5L15 6.5V16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M11 3v4h4" />
    </>
  ),
  search: (
    <>
      <circle cx="8.8" cy="8.8" r="5" />
      <path d="m12.6 12.6 3.9 3.9" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
    </>
  ),
  pencil: <path d="M13.5 3.8a1.6 1.6 0 0 1 2.3 2.3L7.3 14.6l-3.1.8.8-3.1 8.5-8.5Z" />,
  person: (
    <>
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c.6-3 3-4.5 6-4.5s5.4 1.5 6 4.5" />
    </>
  ),
  bolt: <path d="M11 2.5 4.5 11H10l-1 6.5L15.5 9H10l1-6.5Z" />,
  heart: <path d="M10 16.5s-6.5-3.8-6.5-8.3A3.4 3.4 0 0 1 10 6.3a3.4 3.4 0 0 1 6.5 1.9c0 4.5-6.5 8.3-6.5 8.3Z" />,
  book: (
    <>
      <path d="M10 5.5C8.5 4.4 6.4 4 3.5 4v11c2.9 0 5 .4 6.5 1.5 1.5-1.1 3.6-1.5 6.5-1.5V4c-2.9 0-5 .4-6.5 1.5Z" />
      <path d="M10 5.5v11" />
    </>
  ),
  sun: (
    <>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M10 2.8v1.6M10 15.6v1.6M2.8 10h1.6M15.6 10h1.6M4.9 4.9 6 6M14 14l1.1 1.1M4.9 15.1 6 14M14 6l1.1-1.1" />
    </>
  ),
  xmark: <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className, title }: { name: IconName; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("size-4 shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type Variant = "primary" | "secondary" | "plain" | "destructive";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 h-8 text-[13px] font-medium select-none transition-colors disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap";

const BUTTON_VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white shadow-card hover:bg-accent-hover",
  secondary: "bg-surface text-label border border-separator-strong shadow-card hover:bg-surface-2",
  plain: "text-accent-text hover:bg-accent-soft",
  destructive: "bg-surface text-red border border-separator-strong shadow-card hover:bg-red-soft",
};

export function Button({
  variant = "secondary",
  icon,
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: IconName; size?: "md" | "lg" }) {
  return (
    <button
      type="button"
      className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], size === "lg" && "h-10 px-4 text-[14px]", className)}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

export function ButtonLink({
  to,
  variant = "secondary",
  icon,
  size = "md",
  className,
  children,
}: {
  to: string;
  variant?: Variant;
  icon?: IconName;
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], size === "lg" && "h-10 px-4 text-[14px]", className)}
    >
      {icon && <Icon name={icon} />}
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Layout pieces                                                       */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <header className="mb-6">
      {back && (
        <Link
          to={back.to}
          className="mb-2 inline-flex items-center gap-0.5 text-[13px] text-accent-text hover:underline"
        >
          <Icon name="chevronLeft" className="size-3.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.01em] text-label">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-[14px] text-label-2">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function Card({
  children,
  className,
  title,
  description,
  actions,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  as?: "section" | "div";
}) {
  return (
    <As className={cx("rounded-xl border border-separator bg-surface shadow-card", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-separator px-4 py-3">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-label">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-label-2">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </As>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-label-3">{children}</h3>;
}

type Tone = "neutral" | "accent" | "green" | "orange" | "red" | "blue";

const BADGE_TONES: Record<Tone, string> = {
  neutral: "bg-fill text-label-2",
  accent: "bg-accent-soft text-accent-text",
  green: "bg-green-soft text-green",
  orange: "bg-orange-soft text-orange",
  red: "bg-red-soft text-red",
  blue: "bg-blue-soft text-blue",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap",
        BADGE_TONES[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} className="size-3.5" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "draft" | "approved" }) {
  return status === "approved" ? (
    <Badge tone="green" icon="checkCircle">
      Approved
    </Badge>
  ) : (
    <Badge tone="orange" icon="pencil">
      Draft
    </Badge>
  );
}

export function Callout({
  tone = "blue",
  icon = "info",
  title,
  children,
  className,
}: {
  tone?: "blue" | "orange" | "red" | "green";
  icon?: IconName;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    blue: "bg-blue-soft text-blue",
    orange: "bg-orange-soft text-orange",
    red: "bg-red-soft text-red",
    green: "bg-green-soft text-green",
  };
  return (
    <div className={cx("flex gap-2.5 rounded-xl px-3.5 py-3", tones[tone], className)} role="note">
      <Icon name={icon} className="mt-0.5 size-[18px]" />
      <div className="min-w-0 text-[13px] text-label">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(!!title && "mt-0.5", "text-label-2")}>{children}</div>}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-fill p-0.5">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cx(
              "h-7 rounded-md px-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              selected ? "bg-surface text-label shadow-card" : "text-label-2 hover:text-label",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cx("size-4 animate-spin", className)} aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.2" />
      <path d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-label-2" role="status">
      <Spinner />
      {label}
    </div>
  );
}

export function EmptyState({
  icon = "tray",
  title,
  children,
}: {
  icon?: IconName;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <Icon name={icon} className="size-8 text-label-3" />
      <p className="mt-3 text-[15px] font-semibold text-label">{title}</p>
      {children && <div className="mt-1 max-w-sm text-[13px] text-label-2">{children}</div>}
    </div>
  );
}

export function ProgramDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ background: color }}
    />
  );
}

export function ProgressBar({ value, tone = "accent", label }: { value: number; tone?: "accent" | "green" | "orange"; label: string }) {
  const color = { accent: "bg-accent", green: "bg-green", orange: "bg-orange" }[tone];
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-fill"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      <div className={cx("h-full rounded-full", color)} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}
