import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getTemplate } from "../shared/programs";
import { SAMPLE_NOTES } from "../shared/samples";
import type { CaseRecord, ExtractResponse } from "../shared/schemas";
import { entriesFromExtraction } from "../shared/validation";
import { createApp } from "../server/app";
import { RecordStore } from "../server/db";
import { resetDemo } from "../server/seed";

let server: Server;
let base = "";
const store = new RecordStore(":memory:");

async function call<T = unknown>(path: string, init?: { method?: string; body?: unknown }) {
  const res = await fetch(base + path, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: (text ? JSON.parse(text) : null) as T };
}

beforeAll(async () => {
  resetDemo(store);
  const app = createApp({ store, liveAvailable: () => false });
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
  store.close();
});

describe("API", () => {
  it("reports that live Claude is not configured without exposing secrets", async () => {
    const r = await call<{ liveAvailable: boolean; credentialHint: string }>("/api/config");
    expect(r.status).toBe(200);
    expect(r.body.liveAvailable).toBe(false);
    expect(JSON.stringify(r.body)).not.toMatch(/sk-ant/);
  });

  it("refuses live extraction when no key is configured (never fakes a live result)", async () => {
    const r = await call("/api/extract", {
      method: "POST",
      body: { templateId: "housing-visit-note", sourceText: SAMPLE_NOTES[0].text, mode: "live" },
    });
    expect(r.status).toBe(409);
  });

  it("runs the full journey: extract → draft → blocked approval → fix → approve → reopen → export", async () => {
    const sample = SAMPLE_NOTES.find((s) => s.id === "housing-eviction-notice")!;
    const template = getTemplate(sample.templateId)!;

    const ex = await call<ExtractResponse>("/api/extract", {
      method: "POST",
      body: { templateId: template.id, sourceText: sample.text, mode: "offline" },
    });
    expect(ex.status).toBe(200);
    expect(ex.body.meta.mode).toBe("offline");
    expect(ex.body.meta.engine).toMatch(/not Claude/);
    expect(ex.body.fields.follow_up_date.status).toBe("not_stated");

    const fields = entriesFromExtraction(template, ex.body.fields);
    const created = await call<CaseRecord>("/api/records", {
      method: "POST",
      body: { templateId: template.id, sourceText: sample.text, fields, extraction: ex.body.meta },
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("draft");
    const id = created.body.id;

    const blocked = await call<{ details: { fieldKey: string }[] }>(`/api/records/${id}/approve`, {
      method: "POST",
      body: { fields, reviewer: "Test Reviewer", attested: true },
    });
    expect(blocked.status).toBe(422);
    expect(blocked.body.details[0].fieldKey).toBe("follow_up_date");

    const noAttest = await call(`/api/records/${id}/approve`, {
      method: "POST",
      body: { fields, reviewer: "Test Reviewer", attested: false },
    });
    expect(noAttest.status).toBe(400);

    fields.follow_up_date = { ...fields.follow_up_date, value: "2026-11-10", origin: "staff" };
    const approved = await call<CaseRecord>(`/api/records/${id}/approve`, {
      method: "POST",
      body: { fields, reviewer: "Test Reviewer", attested: true },
    });
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe("approved");
    expect(approved.body.fields.follow_up_date.value).toBe("2026-11-10");

    const editApproved = await call(`/api/records/${id}`, { method: "PUT", body: { fields } });
    expect(editApproved.status).toBe(409);

    const reopened = await call<CaseRecord>(`/api/records/${id}`);
    expect(reopened.body.fields.follow_up_date.value).toBe("2026-11-10");
    const re = await call<CaseRecord>(`/api/records/${id}/reopen`, { method: "POST", body: { by: "Test Reviewer" } });
    expect(re.body.status).toBe("draft");
    expect(re.body.history.map((h) => h.action)).toEqual(["created", "approved", "reopened"]);

    const exp = await call<{ record: { fields: Record<string, { value: unknown }> }; notice: string }>(
      `/api/records/${id}/export`,
    );
    expect(exp.status).toBe(200);
    expect(exp.headers.get("content-disposition")).toMatch(/attachment; filename="case-note-H-2041/);
    expect(exp.body.notice).toMatch(/Synthetic/);
    expect(exp.body.record.fields.documents_needed.value).toEqual(["Last 2 pay stubs", "Copy of the lease"]);
  });

  it("validates request bodies", async () => {
    const r = await call("/api/extract", {
      method: "POST",
      body: { templateId: "housing-visit-note", sourceText: "short", mode: "offline" },
    });
    expect(r.status).toBe(400);
    expect((await call("/api/records/does-not-exist")).status).toBe(404);
  });

  it("computes quality metrics and resets the demo reliably", async () => {
    const q = await call<{ totals: { records: number } }>("/api/quality");
    expect(q.body.totals.records).toBe(5);
    for (let i = 0; i < 2; i++) {
      const r = await call<{ records: number }>("/api/demo/reset", { method: "POST" });
      expect(r.body.records).toBe(4);
    }
    const list = await call<CaseRecord[]>("/api/records");
    expect(list.body).toHaveLength(4);
    expect(list.body.filter((r) => r.status === "approved")).toHaveLength(3);
    expect(list.body.every((r) => r.synthetic)).toBe(true);
  });
});
