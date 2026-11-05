import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const SHOTS = process.env.SCREENSHOT_DIR;
const shot = async (page: import("@playwright/test").Page, name: string) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
};

test.beforeEach(async ({ request }) => {
  const r = await request.post("/api/demo/reset");
  expect(r.ok()).toBeTruthy();
});

test("panel demo: housing note from dashboard to reopened record", async ({ page }) => {
  // 1. Dashboard
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Synthetic demo records only")).toBeVisible();
  await shot(page, "01-dashboard");

  // 2–3. Housing Assistance → Case / Visit Note
  await page.getByRole("link", { name: "New Case Note" }).click();
  await page.getByRole("listitem").filter({ hasText: "Housing Assistance" }).click();
  await page.getByRole("button", { name: /Case \/ Visit Note/ }).click();
  await expect(page.getByRole("heading", { name: "Case information" })).toBeVisible();

  // 4. Load the synthetic example
  await page.getByRole("button", { name: "Load sample note" }).click();
  await expect(page.getByLabel("Case information")).toHaveValue(/client H-2041/);
  await expect(page.getByText("Offline demo mode: Claude is not being called.")).toBeVisible();
  await shot(page, "02-editor");

  // 5. Standardize (offline demo, clearly labeled)
  await page.getByRole("button", { name: /Standardize/ }).click();
  await expect(page).toHaveURL(/\/records\/.+\/review$/);
  await expect(page.getByText("Offline demo fixture (not Claude)").first()).toBeVisible();

  // 6. Missing follow-up date is flagged and approval is blocked
  await expect(page.getByText("1 to fix")).toBeVisible();
  const followUp = page.getByLabel(/Follow-up date/);
  await expect(followUp).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Visit summary").focus();
  await expect(page.locator("mark.evidence")).toContainText("worried about losing it");
  await shot(page, "03-review-flagged");
  await page.getByRole("button", { name: "Approve and save" }).click();
  await expect(followUp).toBeFocused();

  // 7. Correct the information
  await followUp.fill("2026-11-10");
  await expect(page.getByText("Ready to approve")).toBeVisible();
  await expect(page.getByText("Added by staff")).toBeVisible();

  // 8. Approve and save (needs reviewer + attestation)
  await page.getByRole("button", { name: "Approve and save" }).click();
  await expect(page.getByText("Enter the reviewer's name.")).toBeVisible();
  // The window itself must never scroll; only the content pane does (sidebar stays put).
  expect(await page.evaluate(() => document.scrollingElement!.scrollHeight)).toBeLessThanOrEqual(900);
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeInViewport();
  await page.getByLabel("Reviewer name").fill("Rosa M. (demo CHW)");
  await page.getByRole("checkbox").check();
  await shot(page, "04-review-ready");
  await page.getByRole("button", { name: "Approve and save" }).click();
  await expect(page).toHaveURL(/\/records\/[^/]+$/);
  await expect(page.getByText("Approved").first()).toBeVisible();
  await expect(page.getByText("Nov 10, 2026")).toBeVisible();
  const recordUrl = page.url();
  await shot(page, "05-record");

  // JSON export
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  const json = JSON.parse(readFileSync(await download.path(), "utf8"));
  expect(json.record.fields.follow_up_date.value).toBe("2026-11-10");
  expect(json.record.status).toBe("approved");
  expect(json.notice).toMatch(/Synthetic/);

  // 9. Reopen the saved record from the library
  await page.getByRole("link", { name: "Saved Records" }).first().click();
  await expect(page.getByRole("table")).toContainText("H-2041");
  await shot(page, "06-library");
  await page.getByRole("button", { name: "Open record H-2041" }).click();
  await expect(page).toHaveURL(recordUrl);
  await expect(page.getByText("Rosa M. (demo CHW)").first()).toBeVisible();

  await page.getByRole("button", { name: "Reopen to edit" }).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByLabel(/Follow-up date/)).toHaveValue("2026-11-10");
});

test("quality dashboard, templates and reset", async ({ page }) => {
  await page.goto("/quality");
  await expect(page.getByRole("heading", { name: "Documentation Quality" })).toBeVisible();
  await expect(page.getByText("Complete approved notes")).toBeVisible();
  await shot(page, "07-quality");

  await page.goto("/templates");
  await expect(page.getByRole("option", { name: /Case \/ Visit Note/ }).first()).toBeVisible();
  await shot(page, "08-templates");

  await page.goto("/settings");
  await page.getByRole("button", { name: "Reset demo data…" }).click();
  await page.getByRole("button", { name: "Reset demo data", exact: true }).click();
  await expect(page.getByText("Demo reset. 4 synthetic records loaded.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("live mode is unavailable without a key and says so", async ({ page }) => {
  await page.goto("/new?program=health&template=health-visit-note");
  await expect(page.getByRole("radio", { name: "Live Claude" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Standardize (offline demo)" })).toBeDisabled();
  await page.getByLabel("Case information").fill("Short");
  await expect(page.getByRole("button", { name: "Standardize (offline demo)" })).toBeDisabled();
});
