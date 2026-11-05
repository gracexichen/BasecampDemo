import type {
  AppConfig,
  ApproveRecordInput,
  CaseRecord,
  CreateRecordInput,
  ExtractRequest,
  ExtractResponse,
  Issue,
  UpdateRecordInput,
} from "../../shared/schemas";
import type { QualityReport } from "../../shared/validation";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("Can't reach the app server. Make sure `npm run dev` is still running.", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.error ?? `Request failed (${res.status}).`, res.status, body?.details);
  return body as T;
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) });

export const api = {
  config: () => request<AppConfig>("/api/config"),
  extract: (input: ExtractRequest) => request<ExtractResponse>("/api/extract", json("POST", input)),
  records: () => request<CaseRecord[]>("/api/records"),
  record: (id: string) => request<CaseRecord>(`/api/records/${id}`),
  createRecord: (input: CreateRecordInput) => request<CaseRecord>("/api/records", json("POST", input)),
  updateRecord: (id: string, input: UpdateRecordInput) => request<CaseRecord>(`/api/records/${id}`, json("PUT", input)),
  approveRecord: (id: string, input: ApproveRecordInput) =>
    request<CaseRecord>(`/api/records/${id}/approve`, json("POST", input)),
  reopenRecord: (id: string, by: string) => request<CaseRecord>(`/api/records/${id}/reopen`, json("POST", { by })),
  quality: () => request<QualityReport>("/api/quality"),
  resetDemo: () => request<{ ok: boolean; records: number }>("/api/demo/reset", { method: "POST" }),
  exportUrl: (id: string) => `/api/records/${id}/export`,
};

export function issuesFrom(err: unknown): Issue[] {
  return err instanceof ApiError && Array.isArray(err.details) ? (err.details as Issue[]) : [];
}
