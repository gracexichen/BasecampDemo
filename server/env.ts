import { existsSync } from "node:fs";

/** Load .env if present. Values are never printed. */
export function loadEnv(): void {
  if (existsSync(".env")) process.loadEnvFile(".env");
}

export const DEFAULT_MODEL = "claude-opus-5-5";

export function hasLiveCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim() || process.env.ANTHROPIC_AUTH_TOKEN?.trim());
}

export function modelName(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}
