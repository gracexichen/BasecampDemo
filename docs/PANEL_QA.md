# Likely panel questions

These are short answers in plain language. Numbers marked *estimate* have not been measured yet.

## Architecture

**How does it work?**
It is a small web app that runs on one laptop. The browser page (React) talks to a local server (Node.js). The server keeps records in a local SQLite database file and is the only part that talks to Claude. One set of rules, written with Zod, defines the template fields and the checks. The browser and the server use the same rules, so they can't disagree.

**What does Claude actually do?**
It does one step: it reads the note and returns the template fields as structured data. For each field, Claude says whether the note states it, what the value is, and gives a word-for-word quote as evidence. The app does everything else in plain code: required-field checks, date checks, saving and approval.

**How would it fit into CommHealth Tracker?**
The template definitions and the extraction step are separate from the screens. In a later phase, CHT could call the same "standardize this note" step and show the same review screen inside CHT. Juan would decide how that fits, and Jonathan would decide what data can be sent.

## Build versus buy

**Why not just use Claude or ChatGPT directly, as staff already do?**
That is today's problem. Everyone writes their own prompts, so two CHWs get different records. Here the template, the instructions and the checks are fixed and shared, so everyone gets the same structure.

**Why not a generic forms tool?**
A form makes CHWs retype everything. The point is to let them write naturally and have the structure filled in for them, with the gaps flagged. Templates are plain data, so El Sol's team can change fields without rebuilding the app.

**Should El Sol build this inside CHT or buy something?**
We don't know yet. CHT is El Sol's own platform and already has AI on its roadmap, so adding one standard step there may be cheaper than adding another tool. That is a question for Juan in Week 1.

## Security and privacy

**Does any real client data go to Claude?**
No. The prototype uses only sample notes our pod wrote. Per the PRD, no real client data goes to Claude until Jonathan approves the data rules, including whether notes must be de-identified first.

**Where is data stored?**
Records are stored in a database file on this laptop, which Git ignores. There is no cloud storage and no CHT connection.

**Where is the API key?**
It is in a local `.env` file that only the server reads. The key is never sent to the browser and is never committed to GitHub. The app also runs without a key, in a clearly labeled offline mode.

**Who can see records?**
In the prototype, anyone using the laptop can. Real permissions would come from CHT's existing roles, which is the PRD's "accessible to those with pre-existing permissions."

## Hallucinations and accuracy

**What if Claude makes something up?**
There are three layers of protection:

1. The instructions tell Claude to mark anything the note doesn't say as "not stated."
2. Every value must come with a quote from the note. The app checks that the quote is really in the note and warns the reviewer if it isn't.
3. A CHW reviews and approves every record, with the source highlighted next to each field.

The demo shows this: the note never gives a follow-up date, so the field is flagged instead of filled in.

**How would you know it works?**
The PRD plan is to run 5 evaluation cases before the pilot. Required fields would be checked by exact match, and written fields would be scored against a rubric. The guardrail is zero invented facts in evaluation runs and supervisor spot-checks. The automated tests already check that every sample value is backed by a real quote.

**What if Claude refuses or errors?**
The app shows a plain error and nothing is saved. The CHW can try again or switch to offline mode, which is clearly labeled.

## Costs

**What does it cost to run?**
*Estimate:* a note like the demo note is roughly 1,500 input tokens and under 1,000 output tokens. On Claude Opus 5.5 at low effort ($4 / $20 per million tokens), that is about 2–3¢ per note. The PRD guardrail is under 5¢. At about 1,200 notes a week, that is roughly $25–40 a week.

A smaller model such as Claude Haiku 5.5 would cost a fraction of a cent per note. Whether it is accurate enough is something the evaluation cases would tell us, and it is El Sol's decision. The app shows real token counts and cost for every live extraction, so the pilot can measure actual cost.

**What does El Sol get back?**
*Estimate from the PRD:* about 100 staff hours a week (range 10–670) no longer spent deciding formats and fixing AI output, plus records in one format for leadership decisions, claims and reports. This hasn't been measured. The pilot would time 3–5 CHWs before and after.

## Future CommHealth Tracker integration

**What's next?**

- **Walk phase:** confirm the real fields with CHWs and a supervisor, add follow-up notes, and pilot with 3–5 CHWs for 2 weeks.
- **Run phase:** build the same step into CHT, using CHT's permissions and El Sol's approved model endpoint (for example, through Azure if that is what Jonathan approves), and save records directly to CHT.

**What would make you stop?**
The PRD's decision rule: stop if notes take no less time or CHWs don't use the tool, and change the template if notes are faster but still inconsistent.

## What's real in the demo

| Part | Status |
|---|---|
| Programs, templates and checks | Real, but the programs and fields are illustrative drafts |
| Claude extraction | Real when a key is configured. Otherwise a labeled offline fixture. |
| Review, approval, saving, reopening, export | Real (local database) |
| Quality dashboard | Real calculations on sample data |
| Client notes | Synthetic, written by our pod |
| CHT, Azure, cloud | Not connected |
