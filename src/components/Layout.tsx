import { NavLink, Outlet, useLocation } from "react-router";
import { PROGRAMS } from "../../shared/programs";
import { useAppState } from "../lib/app-state";
import { Badge, Icon, ProgramDot, cx, type IconName } from "./ui";
import { useEffect, useRef, type CSSProperties } from "react";

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: "home", end: true },
  { to: "/new", label: "New Case Note", icon: "compose" },
  { to: "/records", label: "Saved Records", icon: "tray" },
  { to: "/templates", label: "Templates", icon: "template" },
  { to: "/quality", label: "Documentation Quality", icon: "chart" },
];

function navClass({ isActive }: { isActive: boolean }) {
  return cx(
    "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors",
    isActive
      ? "bg-accent-soft font-semibold text-accent-text shadow-[inset_3px_0_0_var(--sun)]"
      : "text-label hover:bg-fill",
  );
}

function Sidebar() {
  const { config, effectiveMode } = useAppState();
  return (
    <aside
      className="flex w-[244px] shrink-0 flex-col border-r border-separator bg-sidebar"
      aria-label="Sidebar"
    >
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <img src="/favicon.svg" alt="" className="size-8 rounded-[7px]" />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-[15px] font-extrabold text-accent-text">CommHealth</p>
          <p className="truncate text-[12px] text-label-2">Documentation Center</p>
        </div>
      </div>

      <nav aria-label="Main" className="flex flex-col gap-0.5 px-2.5">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
            <Icon name={n.icon} className="text-accent" />
            {n.label}
          </NavLink>
        ))}
      </nav>

      <p className="mt-6 mb-1 px-5 text-[11px] font-semibold uppercase tracking-[0.05em] text-label-3">
        Programs
      </p>
      <nav aria-label="Programs" className="flex flex-col gap-0.5 px-2.5">
        {PROGRAMS.map((p) => (
          <NavLink key={p.id} to={`/programs/${p.id}`} className={navClass}>
            <ProgramDot color={p.color} className="ml-0.5 mr-0.5" />
            <span className="truncate">{p.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-separator px-4 py-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cx("flex items-center gap-2 rounded-md text-[13px]", isActive ? "font-semibold text-label" : "text-label-2 hover:text-label")
          }
        >
          <Icon name="gear" />
          Settings and demo
        </NavLink>
        <div className="flex flex-wrap items-center gap-1.5" aria-live="polite">
          {effectiveMode === "live" ? (
            <Badge tone="green" icon="sparkles">
              Live Claude
            </Badge>
          ) : (
            <Badge tone="orange" icon="bolt">
              Offline demo
            </Badge>
          )}
          {config && !config.liveAvailable && <span className="text-[11px] text-label-3">No API key</span>}
        </div>
      </div>
    </aside>
  );
}

function DemoBanner() {
  return (
    <div
      className="flex items-center gap-2 border-b border-separator bg-surface-2 px-6 py-1.5 text-[12px] text-label-2"
      role="note"
    >
      <Icon name="lock" className="size-3.5" />
      <span>
        <strong className="font-semibold text-label">Prototype.</strong> Synthetic demo records only. Not connected to
        CommHealth Tracker. Programs are illustrative.
      </span>
    </div>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useAppState();
  return (
    <div
      className="pointer-events-none fixed top-10 left-[calc(50%+122px)] z-50 flex -translate-x-1/2 flex-col items-center gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "pointer-events-auto relative flex min-w-[260px] max-w-sm items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-raised",
            t.tone === "celebrate" ? "pop-in border-sun bg-surface" : "fade-in border-separator bg-surface",
          )}
          role={t.tone === "error" ? "alert" : "status"}
        >
          {t.tone === "celebrate" && <Confetti />}
          {t.tone === "celebrate" ? (
            <span className="-my-0.5 flex size-6 items-center justify-center rounded-full bg-sun text-[#143f6a]">
              <Icon name="sun" className="sun-spin size-4" />
            </span>
          ) : (
            <Icon
              name={t.tone === "error" ? "warning" : t.tone === "info" ? "info" : "checkCircle"}
              className={cx("mt-0.5 size-[18px]", t.tone === "error" ? "text-red" : t.tone === "info" ? "text-blue" : "text-green")}
            />
          )}
          <p className="flex-1 text-[13px] text-label">{t.text}</p>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="rounded p-0.5 text-label-3 hover:text-label"
            aria-label="Dismiss notification"
          >
            <Icon name="xmark" className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

const CONFETTI_COLORS = ["#ffcc32", "#143f6a", "#0075af", "#d99a00", "#8a5cc7"];

/** A small one-shot burst of sun-colored confetti behind the toast icon. */
function Confetti() {
  return (
    <span aria-hidden="true" className="pointer-events-none">
      {Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 38 + (i % 3) * 14;
        return (
          <span
            key={i}
            className="confetti"
            style={
              {
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                "--dx": `${Math.cos(angle) * dist}px`,
                "--dy": `${Math.sin(angle) * dist}px`,
                "--rot": `${(i % 2 ? 1 : -1) * (120 + i * 20)}deg`,
                animationDelay: `${(i % 4) * 30}ms`,
              } as CSSProperties
            }
          />
        );
      })}
    </span>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  // Start each page at the top, like a new window pane.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-full overflow-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        {/* `relative` keeps visually hidden labels inside this scroll area so the window itself never scrolls. */}
        <main id="main" ref={mainRef} className="relative min-h-0 flex-1 overflow-y-auto focus:outline-none" tabIndex={-1}>
          <div className="mx-auto w-full max-w-[1240px] px-8 py-7">
            <Outlet />
          </div>
        </main>
      </div>
      <Toasts />
    </div>
  );
}
