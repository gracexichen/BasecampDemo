import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppConfig, ExtractionMode } from "../../shared/schemas";
import { api } from "./api";

export interface Toast {
  id: number;
  text: string;
  tone: "success" | "error" | "info" | "celebrate";
}

interface AppState {
  config: AppConfig | null;
  configError: string | null;
  /** The mode the user picked. Live is only used when it is available. */
  mode: ExtractionMode;
  effectiveMode: ExtractionMode;
  setMode: (m: ExtractionMode) => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
  /** Bumped after a demo reset so pages reload data. */
  dataVersion: number;
  bumpData: () => void;
}

const Ctx = createContext<AppState | null>(null);
const MODE_KEY = "elsol.extractionMode";

function readMode(): ExtractionMode {
  try {
    return localStorage.getItem(MODE_KEY) === "offline" ? "offline" : "live";
  } catch {
    return "live";
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [mode, setModeState] = useState<ExtractionMode>(readMode);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    api
      .config()
      .then(setConfig)
      .catch((e: Error) => setConfigError(e.message));
  }, []);

  const setMode = useCallback((m: ExtractionMode) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* storage unavailable: keep in memory only */
    }
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (text: string, tone: Toast["tone"] = "success") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, text, tone }]);
      window.setTimeout(() => dismissToast(id), 4500);
    },
    [dismissToast],
  );
  const bumpData = useCallback(() => setDataVersion((v) => v + 1), []);

  const value = useMemo<AppState>(
    () => ({
      config,
      configError,
      mode,
      effectiveMode: mode === "live" && config?.liveAvailable ? "live" : "offline",
      setMode,
      toasts,
      toast,
      dismissToast,
      dataVersion,
      bumpData,
    }),
    [config, configError, mode, setMode, toasts, toast, dismissToast, dataVersion, bumpData],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used inside AppStateProvider");
  return v;
}
