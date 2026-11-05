import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { CaseRecordSchema, type CaseRecord } from "../shared/schemas";

/** Local SQLite store for demo records. Synthetic data only. */
export class RecordStore {
  private db: DatabaseSync;

  constructor(file: string) {
    if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL,
        template_id TEXT NOT NULL,
        status TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
  }

  list(): CaseRecord[] {
    const rows = this.db.prepare("SELECT json FROM records ORDER BY updated_at DESC").all() as { json: string }[];
    return rows.map((r) => CaseRecordSchema.parse(JSON.parse(r.json)));
  }

  get(id: string): CaseRecord | undefined {
    const row = this.db.prepare("SELECT json FROM records WHERE id = ?").get(id) as { json: string } | undefined;
    return row ? CaseRecordSchema.parse(JSON.parse(row.json)) : undefined;
  }

  put(record: CaseRecord): CaseRecord {
    const r = CaseRecordSchema.parse(record);
    this.db
      .prepare(
        `INSERT INTO records (id, program_id, template_id, status, updated_at, json)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at, json = excluded.json`,
      )
      .run(r.id, r.programId, r.templateId, r.status, r.updatedAt, JSON.stringify(r));
    return r;
  }

  clear(): void {
    this.db.exec("DELETE FROM records");
  }

  getMeta(key: string): string | undefined {
    const row = this.db.prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value;
  }

  setMeta(key: string, value: string): void {
    this.db.prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
  }

  close(): void {
    this.db.close();
  }
}
