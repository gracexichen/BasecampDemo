import type { FieldDef, Program, Template } from "./schemas";

/**
 * Illustrative programs for the prototype. These are NOT El Sol's confirmed
 * internal program names; they stand in for real programs until the template
 * fields are agreed with El Sol staff.
 */
export const PROGRAMS: Program[] = [
  {
    id: "housing",
    name: "Housing Assistance",
    description: "Rental assistance, eviction prevention and housing referrals.",
    color: "#0075AF",
  },
  {
    id: "health",
    name: "Healthcare Navigation",
    description: "Insurance enrollment, finding care and keeping appointments.",
    color: "#D99A00",
  },
  {
    id: "education",
    name: "Education and Family Support",
    description: "School connections, adult learning and family goals.",
    color: "#8A5CC7",
  },
];

const CONTACT_TYPES = ["Home visit", "Office visit", "Phone call", "Video call", "Community event"];
const LANGUAGES = ["English", "Spanish", "English and Spanish", "Other"];

/** Fields every Case / Visit Note shares, so records stay comparable across programs. */
function visitDetails(): FieldDef[] {
  return [
    {
      key: "client_id",
      label: "Client ID",
      type: "text",
      required: true,
      section: "Visit details",
      help: "The program's client ID. Do not use the client's name.",
      placeholder: "e.g. H-2041",
    },
    {
      key: "visit_date",
      label: "Visit date",
      type: "date",
      required: true,
      section: "Visit details",
      help: "The date the contact took place.",
    },
    {
      key: "contact_type",
      label: "Contact type",
      type: "select",
      required: true,
      section: "Visit details",
      help: "How the contact happened.",
      options: CONTACT_TYPES,
    },
    {
      key: "staff_name",
      label: "Staff member",
      type: "text",
      required: true,
      section: "Visit details",
      help: "The CHW or staff member who made the contact.",
    },
    {
      key: "language",
      label: "Language of service",
      type: "select",
      required: false,
      section: "Visit details",
      help: "Language used during the contact.",
      options: LANGUAGES,
    },
  ];
}

function assessment(): FieldDef[] {
  return [
    {
      key: "reason",
      label: "Reason for contact",
      type: "longtext",
      required: true,
      section: "Assessment",
      help: "Why the contact happened, in one or two sentences.",
    },
    {
      key: "summary",
      label: "Visit summary",
      type: "longtext",
      required: true,
      section: "Assessment",
      help: "What was discussed and what the client shared. Facts only.",
    },
  ];
}

function plan(): FieldDef[] {
  return [
    {
      key: "services_provided",
      label: "Services and referrals provided",
      type: "list",
      required: true,
      section: "Plan and follow-up",
      help: "One per line.",
    },
    {
      key: "next_steps",
      label: "Next steps",
      type: "list",
      required: true,
      section: "Plan and follow-up",
      help: "Who does what next. One per line.",
    },
    {
      key: "follow_up_date",
      label: "Follow-up date",
      type: "date",
      required: true,
      section: "Plan and follow-up",
      help: "When staff will next contact the client.",
    },
    {
      key: "supervisor_flags",
      label: "Concerns for supervisor",
      type: "longtext",
      required: false,
      section: "Plan and follow-up",
      help: "Anything a supervisor should know about. Leave empty if none.",
    },
  ];
}

export const TEMPLATES: Template[] = [
  {
    id: "housing-visit-note",
    programId: "housing",
    name: "Case / Visit Note",
    documentType: "Case / Visit Note",
    version: "0.1",
    status: "active",
    description: "Standard note for any housing assistance contact.",
    fields: [
      ...visitDetails(),
      ...assessment(),
      {
        key: "housing_status",
        label: "Housing status",
        type: "select",
        required: true,
        section: "Assessment",
        help: "The client's housing situation as described in the note.",
        options: [
          "Stably housed",
          "At risk of losing housing",
          "Temporarily housed (shelter or doubled up)",
          "Unhoused",
        ],
      },
      {
        key: "household_size",
        label: "Household size",
        type: "text",
        required: false,
        section: "Assessment",
        help: "Number of people in the household, if stated.",
      },
      {
        key: "documents_needed",
        label: "Documents still needed",
        type: "list",
        required: false,
        section: "Assessment",
        help: "Paperwork the client still needs to gather. One per line.",
      },
      ...plan(),
    ],
  },
  {
    id: "health-visit-note",
    programId: "health",
    name: "Case / Visit Note",
    documentType: "Case / Visit Note",
    version: "0.1",
    status: "active",
    description: "Standard note for any healthcare navigation contact.",
    fields: [
      ...visitDetails(),
      ...assessment(),
      {
        key: "insurance_status",
        label: "Insurance status",
        type: "select",
        required: true,
        section: "Assessment",
        help: "Coverage as described in the note.",
        options: [
          "Medicaid",
          "Medicare",
          "Marketplace plan",
          "Employer plan",
          "Uninsured",
          "Application or renewal pending",
        ],
      },
      {
        key: "appointments",
        label: "Appointments scheduled",
        type: "list",
        required: false,
        section: "Assessment",
        help: "Appointment, place and date. One per line.",
      },
      {
        key: "barriers",
        label: "Barriers to care",
        type: "list",
        required: false,
        section: "Assessment",
        help: "For example transportation, cost or work schedule. One per line.",
      },
      ...plan(),
    ],
  },
  {
    id: "education-visit-note",
    programId: "education",
    name: "Case / Visit Note",
    documentType: "Case / Visit Note",
    version: "0.1",
    status: "active",
    description: "Standard note for any education and family support contact.",
    fields: [
      ...visitDetails(),
      ...assessment(),
      {
        key: "family_members",
        label: "Family members involved",
        type: "text",
        required: false,
        section: "Assessment",
        help: "Who took part or was discussed, without names.",
      },
      {
        key: "family_goal",
        label: "Family goal",
        type: "longtext",
        required: true,
        section: "Assessment",
        help: "The goal the family named, in their words where possible.",
      },
      {
        key: "barriers",
        label: "Barriers",
        type: "list",
        required: false,
        section: "Assessment",
        help: "What is getting in the way. One per line.",
      },
      ...plan(),
    ],
  },
  // Planned templates appear in the template browser so the panel can see the
  // "Walk" phase, but they cannot be used yet.
  ...PROGRAMS.map<Template>((p) => ({
    id: `${p.id}-follow-up`,
    programId: p.id,
    name: "Follow-up Note",
    documentType: "Follow-up Note",
    version: "planned",
    status: "planned",
    description: "Short note for a scheduled follow-up. Planned for the Walk phase.",
    fields: [],
  })),
];

export function getProgram(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function activeTemplatesFor(programId: string): Template[] {
  return TEMPLATES.filter((t) => t.programId === programId && t.status === "active");
}

export function sections(template: Template): { name: string; fields: FieldDef[] }[] {
  const out: { name: string; fields: FieldDef[] }[] = [];
  for (const f of template.fields) {
    let s = out.find((x) => x.name === f.section);
    if (!s) {
      s = { name: f.section, fields: [] };
      out.push(s);
    }
    s.fields.push(f);
  }
  return out;
}
