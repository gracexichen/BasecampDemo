# Panel deck (Basecamp Day 5)

The slides for our 10-minute panel presentation, plus 5 minutes of feedback.

**Deck:** https://claude.ai/artifact/VdEarKkZToXakk8rB6RHMb

The deck uses the app's colors: navy (#143F6A), sun yellow (#FFCC32) and cool grays. The cover has the same sun as the Dashboard header.

The live demo in part 4 follows [DEMO_SCRIPT.md](DEMO_SCRIPT.md). Likely questions are in [PANEL_QA.md](PANEL_QA.md).

## Timing

| Part | Slides | Presenter | Minutes |
|---|---|---|---|
| 1. Host organization | 2 | [name] | 0.5 |
| 2. The problem | 3–4 | [name] | 2.5 |
| 3. Our approach | 5 | [name] | 1.5 |
| 4. The prototype (live demo) | 6 | [name] | 3.5 |
| 5. Measuring success | 7 | [name] | 1 |
| Panel feedback | 8 | All | 5 |

## Slides and speaker notes

### 1. Cover

**CommHealth Documentation Center.** Standard case notes for El Sol's community health workers.
Grace Chen and Dana Souter · El Sol Neighborhood Educational Center

### 2. Our host organization

**El Sol supports families through community health workers (CHW).**

- **Who they are:** a community org whose CHWs serve families in healthcare, housing and other areas
- **What they do:** promote equity through health education
- **Who we worked with:** Jonathan Martinez (IT) and the CHWs who work with the community

> El Sol's CHWs (promotores) help families with access to health care, housing, education and leadership skills. El Sol built CommHealth Tracker (CHT) for programs and case management, and the CHW Learning Hub for training. Its Technology and Innovation team is about 15 people. We worked with Jonathan Martinez (IT and Cybersecurity, our supervisor) and Alexander Fajardo (Executive Director).

### 3. The problem

**CHWs and program staff at El Sol need to document visits, follow-ups, and case notes in a way the whole organization can rely on, but there is no shared workflow or template, so each person invents their own process and inconsistent records flow into leadership decisions, claims, and reports.**

- **Impact:** about 100 staff hours a week. This is our estimate and hasn't been measured yet.
- **Evidence:** the aim is a standard workflow "so staff are not each inventing their own process." (El Sol)

> The 100 hours come from about 40 staff × 6 notes a day × 5 extra minutes (range 10–670 hours). The quote is El Sol's stated goal, from its intake and our Day 1 discovery conversation with Jonathan Martinez.

### 4. Today's journey

**Today: 5 steps, done differently by every CHW.**

1. Find the form, or create their own
2. Gather details
3. Write it their own way
4. Save it anywhere
5. Email it

The process breaks at steps 3–4: there's no shared format.

### 5. Our approach

**One shared template, filled by Claude from the CHW's own words.**

- **Why:** one standard for every CHW
- **Limits:** sample data only, and a CHW approves every note
- **Cost:** about $12–60 a week for AI, roughly 3¢ a document (estimate)
- **Value:** about 100 staff hours a week back (estimate)

> Staff already use Claude and ChatGPT on their own, so every note comes out different. Running costs, from PRD section 5:
> - 3–4 weeks of our build time
> - 1–2 hours of El Sol engineers' time
> - about 1 hour each for 3–5 pilot CHWs
> - about 1,200 notes a week at 1–5¢ each

### 6. The prototype

**From a CHW's own words to a standard record.**

The journey we'll demo:

1. Pick a program and template
2. Paste the note
3. Claude fills it, quoting the note
4. Gaps and missing fields are flagged, and the CHW approves
5. The record is saved to the shared library

What's not real: sample data only, draft fields, and no connection to CHT. Then switch to the live demo.

### 7. How we'd measure success

**Complete notes, written faster.**

| Signal | Today | Target |
|---|---|---|
| Time per note | Not measured | 2+ minutes less |
| Complete notes | [Baseline] | 4 of 5 |
| CHWs using it | 0 | 3 of 5 |

Guardrails: no invented facts, no real client data, and under 5¢ a note.

> We decide at the end of pilot week 2:
> - **Keep** and expand if all three bars are met.
> - **Change** the template if time is saved but notes are still inconsistent.
> - **Stop** if notes take no less time or CHWs don't use it.

### 8. Questions

github.com/gracexichen/BasecampDemo

What's next:
1. Confirm the fields with CHWs.
2. Get the data rules.
3. Run a 2-week pilot.
