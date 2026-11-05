import { Link } from 'react-router';
import { PROGRAMS, getTemplate } from '../../shared/programs';
import { validateRecord } from '../../shared/validation';
import { Badge, Card, EmptyState, Icon, LoadingState, StatusBadge, cx, type IconName } from '../components/ui';
import { api } from '../lib/api';
import { useAppState } from '../lib/app-state';
import { formatDate, formatDateTime, programName, recordTitle } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const HOW_IT_WORKS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'template',
    title: 'Pick a standard template',
    text: 'Every program uses the same Case / Visit Note fields.'
  },
  {
    icon: 'sparkles',
    title: 'Claude structures the note',
    text: 'It fills only what the note says and quotes its source.'
  },
  { icon: 'warning', title: 'Gaps are flagged', text: 'Missing required fields are marked, never guessed.' },
  { icon: 'person', title: 'Staff review and approve', text: 'Nothing is saved as final until a person approves it.' }
];

/** A friendly icon for each illustrative program. */
const PROGRAM_ICONS: Record<string, IconName> = {
  housing: 'home',
  health: 'heart',
  education: 'book'
};

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard() {
  const { dataVersion, effectiveMode } = useAppState();
  const records = useAsync(() => api.records(), [dataVersion]);
  const quality = useAsync(() => api.quality(), [dataVersion]);

  const totals = quality.data?.totals;
  const recent = records.data?.slice(0, 3) ?? [];

  return (
    <>
      <Hero live={effectiveMode === 'live'} drafts={totals?.drafts ?? 0} />

      {/* Record numbers, grouped in one strip */}
      <section
        aria-label="Record totals"
        className="mb-5 grid grid-cols-2 divide-separator rounded-xl border border-separator bg-surface shadow-card sm:grid-cols-3 sm:divide-x">
        <Stat icon="tray" tint="accent" label="Saved records" value={totals?.records} />
        <Stat icon="checkCircle" tint="green" label="Approved" value={totals?.approved} />
        <Stat
          icon="pencil"
          tint="orange"
          label="Drafts to finish"
          value={totals?.drafts}
          highlight={!!totals?.drafts}
        />
      </section>

      <section aria-labelledby="start-heading" className="mb-5">
        <h2 id="start-heading" className="mb-3 font-display text-[18px] font-extrabold text-label">
          Start a case note (by program)
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {PROGRAMS.map((p) => {
            const count = records.data?.filter((r) => r.programId === p.id).length ?? 0;
            return (
              <Link
                key={p.id}
                to={`/new?program=${p.id}&template=${p.id}-visit-note`}
                className="lift wiggle group relative flex flex-col overflow-hidden rounded-xl border border-separator bg-surface p-4 shadow-card hover:border-separator-strong"
                aria-label={`Start a ${p.name} case note`}>
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: p.color }} />
                <div className="flex items-center gap-2.5">
                  <ProgramTile programId={p.id} color={p.color} />
                  <span className="text-[14px] font-semibold text-label">{p.name}</span>
                </div>
                <p className="mt-2 flex-1 text-[13px] text-label-2">{p.description}</p>
                <div className="mt-3 flex items-center justify-between text-[12px] text-label-3">
                  <span>
                    {count} record{count === 1 ? '' : 's'}
                  </span>
                  <span className="flex items-center gap-0.5 font-medium text-accent-text">
                    New note{' '}
                    <Icon name="chevronRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Card
        className="mb-5"
        title="Recent records"
        actions={
          <Link to="/records" className="text-[13px] font-medium text-accent-text hover:underline">
            See all
          </Link>
        }>
        {records.loading && !records.data ? (
          <LoadingState />
        ) : recent.length === 0 ? (
          <EmptyState icon="sun" title="No records yet">
            Start a case note to create the first record.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-separator">
            {recent.map((r) => {
              const t = getTemplate(r.templateId);
              const v = t ? validateRecord(t, r.fields, r.sourceText) : null;
              const program = PROGRAMS.find((p) => p.id === r.programId);
              return (
                <li key={r.id}>
                  <Link
                    to={r.status === 'draft' ? `/records/${r.id}/review` : `/records/${r.id}`}
                    className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2">
                    <ProgramTile programId={r.programId} color={program?.color ?? '#999'} small />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-label">
                        {recordTitle(r)} <span className="font-normal text-label-2">· {programName(r.programId)}</span>
                      </p>
                      <p className="text-[12px] text-label-3">
                        Visit {formatDate(r.fields.visit_date?.value)} · Updated {formatDateTime(r.updatedAt)}
                      </p>
                    </div>
                    {v && r.status === 'draft' && v.issues.some((i) => i.severity === 'error') && (
                      <Badge tone="red" icon="warning">
                        Needs info
                      </Badge>
                    )}
                    <StatusBadge status={r.status} />
                    <Icon
                      name="chevronRight"
                      className="size-3.5 text-label-3 transition-transform group-hover:translate-x-0.5"
                    />
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
          <span className="ml-auto text-[12px] text-label-3">4 steps, always with a person in the loop</span>
        </summary>
        <ol className="grid gap-3 border-t border-separator p-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title} className="relative rounded-lg bg-surface-2 p-3 pt-4">
              <span className="absolute -top-2 left-3 flex size-5 items-center justify-center rounded-full bg-sun text-[11px] font-bold text-[#143f6a]">
                {i + 1}
              </span>
              <span className="mb-2 flex size-7 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
                <Icon name={s.icon} />
              </span>
              <p className="text-[13px] font-semibold text-label">{s.title}</p>
              <p className="text-[13px] text-label-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </details>
    </>
  );
}

function Hero({ live, drafts }: { live: boolean; drafts: number }) {
  return (
    <header className="hero relative mb-5 overflow-hidden rounded-2xl px-6 py-6 text-white shadow-card sm:px-8">
      {/* Decorative sun, a nod to El Sol */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -top-16 -right-10 size-[230px] text-[#ffcc32] opacity-90">
        <g className="sun-spin" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="100" y1="22" x2="100" y2="44" transform={`rotate(${i * 30} 100 100)`} />
          ))}
        </g>
        <circle cx="100" cy="100" r="40" fill="currentColor" />
      </svg>

      <div className="relative max-w-xl">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-white/75">
          {greeting()} <span aria-hidden="true">👋</span>
        </p>
        <h1 className="mt-1 font-display text-[32px] leading-tight font-extrabold tracking-[-0.01em]">Dashboard</h1>
        <p className="mt-1 text-[14px] text-white/80">
          {drafts > 0
            ? `You have ${drafts} draft${drafts === 1 ? '' : 's'} waiting for review. Let's turn today's notes into clean records.`
            : "Everything is approved. Let's turn today's notes into clean records."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Link
            to="/new?program=housing&template=housing-visit-note&sample=housing-eviction-notice"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#ffcc32] px-4 text-[13px] font-semibold text-[#143f6a] shadow-card transition-transform hover:-translate-y-px hover:bg-[#ffd659]">
            <Icon name="compose" />
            New case note
          </Link>
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/12 px-3 text-[12px] font-medium text-white/90">
            <span className={cx('size-2 rounded-full', live ? 'bg-[#4cd068]' : 'bg-[#ffaa40]')} aria-hidden="true" />
            {live ? 'Live Claude is on' : 'Offline demo mode'}
          </span>
        </div>
      </div>
    </header>
  );
}

function ProgramTile({ programId, color, small }: { programId: string; color: string; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx('wiggle-target flex shrink-0 items-center justify-center rounded-lg', small ? 'size-7' : 'size-9')}
      style={{ background: `${color}1f`, color }}>
      <Icon name={PROGRAM_ICONS[programId] ?? 'doc'} className={small ? 'size-4' : 'size-5'} />
    </span>
  );
}

const TINTS = {
  accent: 'bg-accent-soft text-accent-text',
  green: 'bg-green-soft text-green',
  orange: 'bg-orange-soft text-orange'
};

function Stat({
  icon,
  tint,
  label,
  value,
  highlight
}: {
  icon: IconName;
  tint: keyof typeof TINTS;
  label: string;
  value: number | string | undefined;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className={cx('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg', TINTS[tint])}>
        <Icon name={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-label-2">{label}</p>
        <p className="flex items-baseline gap-2">
          <span
            className={cx(
              'font-display text-[22px] font-extrabold tabular-nums',
              highlight ? 'text-orange' : 'text-label'
            )}>
            {value ?? '—'}
          </span>
        </p>
      </div>
    </div>
  );
}
