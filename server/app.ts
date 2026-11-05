import express, { type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { offlineExtract } from "../shared/offline";
import { PROGRAMS, getTemplate } from "../shared/programs";
import {
  ApproveRecordSchema,
  CreateRecordSchema,
  ExtractRequestSchema,
  UpdateRecordSchema,
  type AppConfig,
  type CaseRecord,
  type ExtractResponse,
} from "../shared/schemas";
import { computeQuality, validateRecord } from "../shared/validation";
import { ExtractionError, liveExtract } from "./claude";
import type { RecordStore } from "./db";
import { hasLiveCredentials, modelName } from "./env";
import { resetDemo } from "./seed";

export interface AppOptions {
  store: RecordStore;
  /** Override for tests. */
  liveAvailable?: () => boolean;
  serveStatic?: boolean;
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) {
    throw new HttpError(400, r.error.issues[0]?.message ?? "Invalid request.", z.flattenError(r.error));
  }
  return r.data;
}

const now = () => new Date().toISOString();

export function createApp({ store, liveAvailable = hasLiveCredentials, serveStatic = false }: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "200kb" }));

  const requireRecord = (id: string): CaseRecord => {
    const r = store.get(id);
    if (!r) throw new HttpError(404, "Record not found.");
    return r;
  };

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/config", (_req, res) => {
    const live = liveAvailable();
    const config: AppConfig = {
      liveAvailable: live,
      model: modelName(),
      credentialHint: live
        ? "An Anthropic API credential is configured on the server."
        : "No Anthropic API key is configured. Add ANTHROPIC_API_KEY to .env to enable live Claude extraction.",
    };
    res.json(config);
  });

  app.post("/api/extract", async (req, res) => {
    const input = parse(ExtractRequestSchema, req.body);
    const template = getTemplate(input.templateId);
    if (!template || template.status !== "active") throw new HttpError(400, "Unknown template.");
    const started = Date.now();

    if (input.mode === "live") {
      if (!liveAvailable()) {
        throw new HttpError(409, "Live Claude is not configured. Add an API key, or switch to Offline demo mode.");
      }
      try {
        const r = await liveExtract(template, input.sourceText);
        const body: ExtractResponse = {
          fields: r.fields,
          meta: {
            mode: "live",
            engine: `Claude (${r.model})`,
            model: r.model,
            durationMs: Date.now() - started,
            inputTokens: r.inputTokens,
            outputTokens: r.outputTokens,
            estCostUsd: r.estCostUsd,
            flags: r.flags,
            createdAt: now(),
          },
        };
        res.json(body);
      } catch (err) {
        if (err instanceof ExtractionError) throw new HttpError(err.status, err.message);
        throw err;
      }
      return;
    }

    const r = offlineExtract(template, input.sourceText);
    const body: ExtractResponse = {
      fields: r.fields,
      meta: {
        mode: "offline",
        engine: r.engine,
        model: null,
        durationMs: Date.now() - started,
        inputTokens: null,
        outputTokens: null,
        estCostUsd: null,
        flags: r.flags,
        createdAt: now(),
      },
    };
    res.json(body);
  });

  app.get("/api/records", (_req, res) => {
    res.json(store.list());
  });

  app.get("/api/records/:id", (req, res) => {
    res.json(requireRecord(req.params.id));
  });

  app.get("/api/records/:id/export", (req, res) => {
    const r = requireRecord(req.params.id);
    const t = getTemplate(r.templateId);
    const program = PROGRAMS.find((p) => p.id === r.programId);
    const exported = {
      exportedAt: now(),
      notice: "Synthetic demonstration record. Not real client data.",
      record: {
        id: r.id,
        program: program?.name ?? r.programId,
        template: t ? `${t.documentType} v${t.version}` : r.templateId,
        status: r.status,
        reviewer: r.reviewer,
        approvedAt: r.approvedAt,
        fields: Object.fromEntries(
          (t?.fields ?? []).map((f) => [
            f.key,
            {
              label: f.label,
              value: f.type === "list" ? r.fields[f.key]?.value.split("\n").filter(Boolean) : r.fields[f.key]?.value ?? "",
              notStated: !r.fields[f.key]?.value && !!r.fields[f.key]?.notStatedConfirmed,
              source: r.fields[f.key]?.origin ?? "empty",
            },
          ]),
        ),
        sourceText: r.sourceText,
        extraction: r.extraction,
        history: r.history,
      },
    };
    const clientId = (r.fields.client_id?.value || "record").replace(/[^A-Za-z0-9-]/g, "");
    res.setHeader("Content-Disposition", `attachment; filename="case-note-${clientId}-${r.id.slice(0, 8)}.json"`);
    res.type("application/json").send(JSON.stringify(exported, null, 2));
  });

  app.post("/api/records", (req, res) => {
    const input = parse(CreateRecordSchema, req.body);
    const template = getTemplate(input.templateId);
    if (!template || template.status !== "active") throw new HttpError(400, "Unknown template.");
    const at = now();
    const record: CaseRecord = {
      id: randomUUID(),
      programId: template.programId,
      templateId: template.id,
      templateVersion: template.version,
      status: "draft",
      sourceText: input.sourceText,
      fields: input.fields,
      extraction: input.extraction,
      reviewer: "",
      approvedAt: null,
      createdAt: at,
      updatedAt: at,
      history: [{ at, action: "created", by: "Staff (demo)" }],
      synthetic: true,
    };
    res.status(201).json(store.put(record));
  });

  app.put("/api/records/:id", (req, res) => {
    const r = requireRecord(req.params.id);
    if (r.status === "approved") throw new HttpError(409, "This record is approved. Reopen it before editing.");
    const input = parse(UpdateRecordSchema, req.body);
    const at = now();
    const updated: CaseRecord = {
      ...r,
      fields: input.fields,
      reviewer: input.reviewer ?? r.reviewer,
      updatedAt: at,
      history: [...r.history, { at, action: "saved_draft", by: input.reviewer || "Staff (demo)" }],
    };
    res.json(store.put(updated));
  });

  app.post("/api/records/:id/approve", (req, res) => {
    const r = requireRecord(req.params.id);
    if (r.status === "approved") throw new HttpError(409, "This record is already approved.");
    const input = parse(ApproveRecordSchema, req.body);
    const template = getTemplate(r.templateId)!;
    const v = validateRecord(template, input.fields, r.sourceText);
    if (!v.canApprove) {
      throw new HttpError(422, "Fix the flagged fields before approving.", v.issues.filter((i) => i.severity === "error"));
    }
    const at = now();
    const updated: CaseRecord = {
      ...r,
      fields: input.fields,
      reviewer: input.reviewer,
      status: "approved",
      approvedAt: at,
      updatedAt: at,
      history: [...r.history, { at, action: "approved", by: input.reviewer }],
    };
    res.json(store.put(updated));
  });

  app.post("/api/records/:id/reopen", (req, res) => {
    const r = requireRecord(req.params.id);
    const by = typeof req.body?.by === "string" && req.body.by.trim() ? req.body.by.trim() : "Staff (demo)";
    const at = now();
    const updated: CaseRecord = {
      ...r,
      status: "draft",
      approvedAt: null,
      updatedAt: at,
      history: [...r.history, { at, action: "reopened", by }],
    };
    res.json(store.put(updated));
  });

  app.get("/api/quality", (_req, res) => {
    res.json(computeQuality(store.list(), getTemplate, PROGRAMS.map((p) => p.id)));
  });

  app.post("/api/demo/reset", (_req, res) => {
    const records = resetDemo(store);
    res.json({ ok: true, records: records.length, resetAt: store.getMeta("last_reset") });
  });

  app.use("/api", (_req, _res, next) => next(new HttpError(404, "Not found.")));

  if (serveStatic) {
    const dist = resolve("dist");
    if (existsSync(dist)) {
      app.use(express.static(dist));
      app.get("/{*path}", (_req, res) => res.sendFile(resolve(dist, "index.html")));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, details: err.details });
      return;
    }
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: "Request body is not valid JSON." });
      return;
    }
    console.error("Unexpected error:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Something went wrong on the server." });
  });

  return app;
}
