# CommHealth Documentation Center (prototype)

A Crawl-phase prototype for **El Sol Neighborhood Educational Center**, built by a Claude Corps Basecamp pod (Grace Chen and Dana Souter).

It answers the PRD's question: **can Claude turn a CHW's unstructured case note into a standardized record?** Staff pick a program and a template, paste the note, and Claude fills the template using only what the note says. Missing required information is flagged, never guessed. A staff member reviews, corrects and approves every record before it is saved.

> **Synthetic data only.** Every person, ID and place in this app is fictional. It is not connected to CommHealth Tracker, Azure or any cloud storage. The three programs are illustrative, not El Sol's confirmed program names.

## What it does

The user journey:

**Select program → choose template → enter case information → standardize with Claude → validate → review and edit → approve → save → reopen**

The app has these screens:

- **Dashboard:** start a note for any program, see recent records and the headline numbers.
- **New Case Note:** paste or type the note, or load a synthetic sample.
- **Review:** a two-column screen. The original note is on the left, and the quote behind the selected field is highlighted. The editable record is on the right, with required-field checks and the approval step.
- **Saved Records:** search, filter and reopen records, and export any record as JSON.
- **Templates:** a browser showing every template's fields, which ones are required, and the guidance for each.
- **Documentation Quality:** the PRD's success measures, such as complete notes, AI values kept without edits, cost per note, and the fields notes most often leave out.
- **Settings and demo:** AI mode, the reset button for the demo data, and a list of what the prototype does and doesn't do.

### Guardrails

These come from the PRD:

- **Claude never invents facts.** Every value Claude proposes must carry a short quote from the note. The app checks that the quote is actually in the note and warns staff if it isn't.
- **Required fields are checked by code, not by the AI.** Required fields, date formats, date order and allowed options are validated the same way in the browser and again on the server before approval.
- **Human approval is required.** Approval needs a reviewer name and a confirmation checkbox. Approved records can't be edited until someone reopens them, and each record keeps an activity history.
- **Offline results are never passed off as Claude's.** Offline demo results are labeled "not Claude" everywhere they appear.

## Requirements

- macOS, Windows or Linux with **Node.js 22.13 or newer** (tested on Node 26.13 and npm 11.20). Check with `node -v`.
- Google Chrome, only for the optional browser tests.
- An Anthropic API key, only if you want live Claude extraction. The app runs without one in Offline demo mode.

## Install and run

In a terminal, inside this folder:

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** in Chrome.

`npm run dev` starts two things at once:

- the web app on port **5173**
- a small local API server on port **8787**, which the web app reaches through `/api`

To stop them, press `Ctrl + C` in that terminal.

The first time the API starts, it creates a local SQLite database at `data/demo.db` and loads 4 synthetic records. The `data/` folder is ignored by Git.

### Turning on live Claude (optional)

A Claude Enterprise or claude.ai login **does not** give this app API access. Live extraction needs a separate Anthropic API credential, or El Sol's approved model endpoint once Jonathan approves one.

1. Get an API key from someone who manages an Anthropic API account. Creating one may involve billing, so check with your supervisor first.
2. Copy `.env.example` to `.env`.
3. Paste the key after `ANTHROPIC_API_KEY=`. Never commit `.env`; it is already ignored by Git.
4. Restart `npm run dev`. The sidebar badge changes from **Offline demo** to **Live Claude**.

The key is used only by the local server. It is never sent to the browser.

The default model is `claude-opus-5-5`, called at low effort with structured outputs. To use another model, set `ANTHROPIC_MODEL` in `.env`.

### Offline demo mode

When no key is set, or when you choose **Offline demo**:

- the three sample notes use pre-written results, marked "Offline demo fixture (not Claude)"
- any other text gets simple pattern matching for dates, client IDs and contact type
- everything else is left "not stated" for staff to fill in

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the web app (5173) and API (8787) with live reload |
| `npm run build` | Type-check and build the production web app into `dist/` |
| `npm start` | Serve the built app and API together on http://localhost:8787 (run `npm run build` first) |
| `npm run typecheck` | TypeScript checks for the frontend, backend and shared code |
| `npm run lint` | ESLint |
| `npm test` | Unit and API tests (Vitest) |
| `npm run test:e2e` | Browser tests of the full panel demo in Chrome (Playwright). Resets the demo data. |
| `npm run demo:reset` | Reset the demo database from the terminal |

## Resetting before a demo

Use either of these:

- In the app: **Settings and demo → Reset demo data…**
- In the terminal: `npm run demo:reset`

Both delete every record in the local demo database and reload the 4 synthetic examples (3 approved, 1 draft).

## Project layout

```
shared/     Zod schemas, programs and templates, synthetic samples, validation, offline extractor
server/     Express API, SQLite store (node:sqlite), Claude extraction, demo seed and reset
src/        React + TypeScript + Tailwind frontend (pages/, components/, lib/)
tests/      Vitest unit and API tests
e2e/        Playwright browser test of the panel demo
docs/       DEMO_SCRIPT.md and PANEL_QA.md
```

## Not built yet (deliberately)

- No connection to CommHealth Tracker, Azure or cloud storage. The PRD puts these out of scope until El Sol grants access.
- No sign-in or permissions. Everyone using the local app sees every record.
- Only the Case / Visit Note template is active. Follow-up notes are shown as planned.
- Template fields are a draft and still need to be confirmed with El Sol staff and a CHW supervisor.
- Time saved per note is not measured in the app. The PRD measures it by timing CHWs during the pilot.
