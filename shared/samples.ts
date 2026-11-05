import type { ExtractedField } from "./schemas";

/**
 * Synthetic case notes written by the pod for the prototype.
 * Every person, ID and place here is fictional. No El Sol client data.
 *
 * Each note comes with an offline "fixture": the structured result used in
 * Offline demo mode. Fixtures are hand-written and are never presented as a
 * live Claude response.
 */

export interface SampleNote {
  id: string;
  programId: string;
  templateId: string;
  title: string;
  description: string;
  text: string;
  /** Show in the editor's "Load a sample" menu. Seed-only notes are hidden. */
  showInEditor: boolean;
  fixture: Record<string, ExtractedField>;
  flags: string[];
}

const s = (value: string, evidence: string): ExtractedField => ({ status: "stated", value, evidence });
const ns = (): ExtractedField => ({ status: "not_stated", value: "", evidence: "" });

export const SAMPLE_NOTES: SampleNote[] = [
  {
    id: "housing-eviction-notice",
    programId: "housing",
    templateId: "housing-visit-note",
    title: "Home visit: eviction notice",
    description: "Rental assistance case. The note never gives a follow-up date.",
    showInEditor: true,
    text: `Nov 3 2026 - home visit with client H-2041. Spoke in Spanish. Staff: Rosa M. (demo CHW).

Client got a 14-day notice from her landlord for $1,450 in back rent after her hours were cut at work. She lives with her partner and 2 kids, 4 people total. Still in the apartment for now but worried about losing it and about the kids changing schools.

Helped her start the county emergency rental assistance application. She still needs to get her last 2 pay stubs and a copy of the lease. Referred her to the tenant legal aid clinic for advice on the notice.

Next steps: she will collect the pay stubs and lease, I will submit the application once I have the documents. Will check back with her after she hears from the landlord.`,
    fixture: {
      client_id: s("H-2041", "client H-2041"),
      visit_date: s("2026-11-03", "Nov 3 2026"),
      contact_type: s("Home visit", "home visit"),
      staff_name: s("Rosa M.", "Staff: Rosa M. (demo CHW)"),
      language: s("Spanish", "Spoke in Spanish"),
      reason: s(
        "Client received a 14-day notice from her landlord for $1,450 in back rent after her work hours were cut.",
        "Client got a 14-day notice from her landlord for $1,450 in back rent after her hours were cut at work",
      ),
      summary: s(
        "Client lives with her partner and 2 children. She is still in the apartment but is worried about losing it and about the children changing schools.",
        "Still in the apartment for now but worried about losing it and about the kids changing schools",
      ),
      housing_status: s("At risk of losing housing", "Still in the apartment for now but worried about losing it"),
      household_size: s("4", "4 people total"),
      documents_needed: s(
        "Last 2 pay stubs\nCopy of the lease",
        "She still needs to get her last 2 pay stubs and a copy of the lease",
      ),
      services_provided: s(
        "Started county emergency rental assistance application\nReferral to tenant legal aid clinic",
        "Helped her start the county emergency rental assistance application",
      ),
      next_steps: s(
        "Client collects pay stubs and lease\nStaff submits application once documents are received\nStaff checks back after client hears from landlord",
        "she will collect the pay stubs and lease, I will submit the application once I have the documents",
      ),
      follow_up_date: ns(),
      supervisor_flags: ns(),
    },
    flags: [
      "The note says staff will check back after the client hears from the landlord, but gives no follow-up date.",
    ],
  },
  {
    id: "health-medicaid-renewal",
    programId: "health",
    templateId: "health-visit-note",
    title: "Phone call: Medicaid renewal",
    description: "Lost coverage at renewal; new-patient appointment booked.",
    showInEditor: true,
    text: `10/28/2026 phone call w/ client N-3307 (English). CHW: Marcus T. (demo)

Client lost Medicaid coverage at renewal in September because the renewal packet went to an old address. Renewal application now pending. She has diabetes and has run out of test strips; she has not seen a doctor since spring.

Helped her upload proof of address and income to the renewal portal. Booked a new-patient appointment at Eastside Community Clinic for 11/12/2026 at 9:30am. Gave info on the clinic's sliding-scale pharmacy for test strips in the meantime. She works two jobs and has no car, so getting to appointments is hard - shared the bus route and the clinic's ride line.

Plan: client will call the ride line by 11/10 to book a ride. I'll call her on 11/10/2026 to confirm Medicaid status and the ride.`,
    fixture: {
      client_id: s("N-3307", "client N-3307"),
      visit_date: s("2026-10-28", "10/28/2026"),
      contact_type: s("Phone call", "phone call"),
      staff_name: s("Marcus T.", "CHW: Marcus T. (demo)"),
      language: s("English", "(English)"),
      reason: s(
        "Client lost Medicaid coverage at renewal in September because the renewal packet went to an old address.",
        "Client lost Medicaid coverage at renewal in September because the renewal packet went to an old address",
      ),
      summary: s(
        "Renewal application is pending. Client has diabetes, has run out of test strips and has not seen a doctor since spring.",
        "She has diabetes and has run out of test strips; she has not seen a doctor since spring",
      ),
      insurance_status: s("Application or renewal pending", "Renewal application now pending"),
      appointments: s(
        "New-patient appointment, Eastside Community Clinic, 11/12/2026 at 9:30am",
        "Booked a new-patient appointment at Eastside Community Clinic for 11/12/2026 at 9:30am",
      ),
      barriers: s(
        "Works two jobs\nNo car (transportation)",
        "She works two jobs and has no car, so getting to appointments is hard",
      ),
      services_provided: s(
        "Helped upload proof of address and income to the renewal portal\nBooked new-patient appointment\nInformation on sliding-scale pharmacy for test strips\nShared bus route and clinic ride line",
        "Helped her upload proof of address and income to the renewal portal",
      ),
      next_steps: s(
        "Client calls the ride line by 11/10 to book a ride\nStaff calls client to confirm Medicaid status and the ride",
        "client will call the ride line by 11/10 to book a ride",
      ),
      follow_up_date: s("2026-11-10", "I'll call her on 11/10/2026"),
      supervisor_flags: ns(),
    },
    flags: [],
  },
  {
    id: "education-school-support",
    programId: "education",
    templateId: "education-visit-note",
    title: "Office visit: school support",
    description: "Math and attendance concerns; adult ESL referral.",
    showInEditor: true,
    text: `Office visit 10/30/2026. Client E-1189 came in with her two kids (ages 8 and 12). Staff: Luis P. (demo CHW). Visit in English and Spanish.

Mom says the 12-year-old is failing math and the school sent a letter about attendance. She wants him to catch up before the end of the semester. She also wants to take English classes for herself but works evenings.

Referred the son to free homework help at the public library (Mon-Thu after school). Gave her the schedule for the adult ESL morning class at the community center. Helped her write an email to the school counselor asking for a meeting.

Next: mom will send the email to the counselor this week and visit the library with her son. I'll follow up on 11/13/2026 to see if the counselor meeting is set.`,
    fixture: {
      client_id: s("E-1189", "Client E-1189"),
      visit_date: s("2026-10-30", "Office visit 10/30/2026"),
      contact_type: s("Office visit", "Office visit"),
      staff_name: s("Luis P.", "Staff: Luis P. (demo CHW)"),
      language: s("English and Spanish", "Visit in English and Spanish"),
      reason: s(
        "Client's 12-year-old is failing math and the school sent a letter about attendance.",
        "the 12-year-old is failing math and the school sent a letter about attendance",
      ),
      summary: s(
        "Client wants her son to catch up before the end of the semester. She also wants to take English classes but works evenings.",
        "She wants him to catch up before the end of the semester",
      ),
      family_members: s("Client and her two children (ages 8 and 12)", "came in with her two kids (ages 8 and 12)"),
      family_goal: s(
        "Son catches up in math before the end of the semester; mother takes English classes.",
        "She wants him to catch up before the end of the semester",
      ),
      barriers: s("Mother works evenings\nSchool attendance concerns", "works evenings"),
      services_provided: s(
        "Referral to library homework help (Mon-Thu after school)\nAdult ESL morning class schedule\nHelped write email to school counselor",
        "Referred the son to free homework help at the public library",
      ),
      next_steps: s(
        "Mother emails the counselor this week and visits the library with her son\nStaff follows up on the counselor meeting",
        "mom will send the email to the counselor this week and visit the library with her son",
      ),
      follow_up_date: s("2026-11-13", "I'll follow up on 11/13/2026"),
      supervisor_flags: ns(),
    },
    flags: [],
  },
  {
    id: "housing-fire-displacement",
    programId: "housing",
    templateId: "housing-visit-note",
    title: "Office visit: displaced after fire",
    description: "Seed record for the library.",
    showInEditor: false,
    text: `10/27/2026 office visit, client H-1977. Staff: Rosa M. (demo CHW). In Spanish.
Client and her mother (2 people) are staying with a cousin after a fire in their building. Looking for a 1-bedroom they can afford. Helped her apply to the city housing waitlist and gave the list of affordable units. Still needs a photo ID for her mother.
Next: client gets the ID at the DMV; I check the waitlist status. Follow up 11/06/2026.`,
    fixture: {
      client_id: s("H-1977", "client H-1977"),
      visit_date: s("2026-10-27", "10/27/2026"),
      contact_type: s("Office visit", "office visit"),
      staff_name: s("Rosa M.", "Staff: Rosa M. (demo CHW)"),
      language: s("Spanish", "In Spanish"),
      reason: s(
        "Client and her mother are staying with a cousin after a fire in their building and need housing.",
        "are staying with a cousin after a fire in their building",
      ),
      summary: s("Client is looking for an affordable 1-bedroom.", "Looking for a 1-bedroom they can afford"),
      housing_status: s("Temporarily housed (shelter or doubled up)", "staying with a cousin"),
      household_size: s("2", "(2 people)"),
      documents_needed: s("Photo ID for client's mother", "Still needs a photo ID for her mother"),
      services_provided: s(
        "City housing waitlist application\nList of affordable units",
        "Helped her apply to the city housing waitlist and gave the list of affordable units",
      ),
      next_steps: s("Client gets ID at the DMV\nStaff checks waitlist status", "client gets the ID at the DMV; I check the waitlist status"),
      follow_up_date: s("2026-11-06", "Follow up 11/06/2026"),
      supervisor_flags: ns(),
    },
    flags: [],
  },
  {
    id: "health-dental-fair",
    programId: "health",
    templateId: "health-visit-note",
    title: "Health fair: dental care",
    description: "Seed draft with missing insurance and follow-up.",
    showInEditor: false,
    text: `11/02/2026 community health fair - talked with client N-3410. Staff: Marcus T. (demo CHW).
Client asked about getting a dental cleaning for herself; has not been to a dentist in 3 years because of cost. Gave her the list of low-cost dental clinics. She will call one this week.`,
    fixture: {
      client_id: s("N-3410", "client N-3410"),
      visit_date: s("2026-11-02", "11/02/2026"),
      contact_type: s("Community event", "community health fair"),
      staff_name: s("Marcus T.", "Staff: Marcus T. (demo CHW)"),
      language: ns(),
      reason: s("Client asked about getting a dental cleaning.", "Client asked about getting a dental cleaning for herself"),
      summary: s(
        "Client has not been to a dentist in 3 years because of cost.",
        "has not been to a dentist in 3 years because of cost",
      ),
      insurance_status: ns(),
      appointments: ns(),
      barriers: s("Cost", "because of cost"),
      services_provided: s("List of low-cost dental clinics", "Gave her the list of low-cost dental clinics"),
      next_steps: s("Client calls a dental clinic this week", "She will call one this week"),
      follow_up_date: ns(),
      supervisor_flags: ns(),
    },
    flags: ["Insurance status is not mentioned.", "No follow-up date is given."],
  },
];

export function findSampleByText(text: string): SampleNote | undefined {
  const norm = (x: string) => x.replace(/\s+/g, " ").trim();
  const t = norm(text);
  return SAMPLE_NOTES.find((n) => norm(n.text) === t);
}
