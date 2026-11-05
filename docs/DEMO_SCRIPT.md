# Panel demo script (about 2½ minutes)

This is part 4 of the panel presentation, "The prototype". The problem and today's journey come before it.

## Before the panel

- [ ] Run `npm run dev` and open **http://localhost:5173** in Chrome. Close other tabs.
- [ ] Go to **Settings and demo → Reset demo data…** and confirm. The dashboard should show 4 saved records.
- [ ] Check the sidebar badge, bottom left:
  - **Offline demo** (orange) means no API key, so Claude is not called. Say so up front (see step 0).
  - **Live Claude** (green) means a key is configured and Claude is called for real.
- [ ] Zoom the browser to 110–125% so the room can read it (Cmd +).

## Walkthrough

| # | Do this | Say this |
|---|---|---|
| 0 | Point at the grey banner at the top. | "Before we start: everything here is sample data our pod wrote. No El Sol client data. It runs on this laptop and isn't connected to CommHealth Tracker. *(If offline:)* We don't have an API key on this machine, so the AI step uses a pre-written result for this sample. It's labeled 'not Claude' on screen." |
| 1 | **Dashboard.** | "Today every CHW documents their own way and saves wherever they like. This is one shared place, with the same template for everyone in a program." |
| 2 | Click **New case note**, or **New Case Note → Housing Assistance**. | "A CHW picks the program they're working in." |
| 3 | Click **Case / Visit Note**. Point at the field list on the right. | "And the standard template. These are the fields every housing note needs. Required ones are marked." |
| 4 | Click **Load sample note**. | "This is how notes really get written: fast, in their own words. It's a home visit with a family that got an eviction notice." |
| 5 | Click **Standardize** (with Claude, or the offline demo). | "Claude reads the note and fills the template, and it's only allowed to use what the note says. Every value has to come with a quote from the note." |
| 6 | On the Review screen, hover over **Visit summary** to show the yellow highlight on the left. Then scroll to the red **Follow-up date**. | "On the left is the original note. When I select a field, it highlights where that came from, so a supervisor can check it in seconds. And here's the important part: the note says 'I'll check back with her' but never gives a date. Claude didn't make one up. It's flagged as missing, and the record can't be approved yet." |
| 7 | Type **11/10/2026** into Follow-up date. | "The CHW adds what's missing. The badge shows this value came from staff, not the AI, so we keep track of who said what." |
| 8 | Type a reviewer name, tick the box, then click **Approve and save**. | "A person always approves. Claude never saves a record on its own." |
| 9 | Click **Saved Records**, then click **H-2041**. | "Now it's in the shared library in the same format as every other note, so supervisors and the claims team can find it. They can reopen it, export it, and see its history." |
| 10 | *(If time allows)* Click **Documentation Quality**. | "This is how we'd measure the pilot: are 4 of 5 notes complete, do CHWs keep Claude's drafts with small edits, and does it stay under 5 cents a note. These numbers come from sample data." |

## Closing line

"What's real: the template, the checks, the review and approval flow, and saving and reopening. *(Live:)* The Claude step is real too. *(Offline:)* The Claude step is built and ready, and it runs as soon as we have an approved API key. What's still to do: confirm the real fields with El Sol's CHWs and supervisors, and get Jonathan's data rules before any real note goes near it."

## If something goes wrong

- **The page won't load:** in the terminal, press `Ctrl + C`, then run `npm run dev` again.
- **Live Claude errors:** click **Try Offline demo instead**, which appears in the error message, and say so out loud.
- **The data looks messy from rehearsals:** go to **Settings and demo → Reset demo data…**
