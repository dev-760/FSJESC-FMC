import { z } from "zod";

/**
 * Contact enquiry schema.
 *
 * Shared by the form's HTML constraints and the Server Action's validation, so the
 * two cannot drift. TypeScript types are compile-time only and are not validation
 * — the action parses this schema on arrival (N7).
 */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please give a name we can address you by").max(120),
  email: z.email("Enter a valid email address").max(254),
  topic: z.enum(["PROGRAMME", "SIMULATOR", "COMPETITIONS", "COLLABORATION", "OTHER"], {
    error: "Choose a topic",
  }),
  message: z
    .string()
    .trim()
    .min(30, "Please give a little more detail — at least 30 characters")
    .max(4_000, "Please keep the message under 4000 characters"),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactValues = z.output<typeof contactSchema>;

export const CONTACT_TOPICS = [
  { value: "PROGRAMME", label: "The programme and sessions" },
  { value: "SIMULATOR", label: "The trading simulator" },
  { value: "COMPETITIONS", label: "Competitions and challenges" },
  { value: "COLLABORATION", label: "A collaboration or workshop" },
  { value: "OTHER", label: "Something else" },
] as const satisfies readonly { value: ContactValues["topic"]; label: string }[];

/** Field names the form can report an error against. */
export const CONTACT_FIELDS = ["name", "email", "topic", "message"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

/** Fixed, server-rendered error text. Nothing derived from the submission is echoed back. */
export const CONTACT_FIELD_LABELS: Record<ContactField, string> = {
  name: "Please give a name we can address you by.",
  email: "Enter a valid email address.",
  topic: "Choose a topic.",
  message: "Please give at least 30 characters of detail.",
};

export const CONTACT_STATUSES = ["idle", "received", "invalid", "failed"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_MESSAGES: Record<ContactStatus, string> = {
  idle: "",
  received: "Thank you. Your message has been recorded and we will reply by email.",
  invalid: "Some fields need attention before this can be sent.",
  failed: "Your message could not be sent. Please email us directly.",
};

/**
 * Parse the result of a contact submission from the query string.
 *
 * Untrusted input: an unknown status collapses to `idle` and unknown field names
 * are dropped, so a hand-edited URL cannot inject a message or a field name.
 */
export function parseContactResult(params: {
  status?: string | string[] | undefined;
  fields?: string | string[] | undefined;
}): { status: ContactStatus; fields: ContactField[] } {
  const rawStatus = first(params.status);
  const status: ContactStatus = (CONTACT_STATUSES as readonly string[]).includes(rawStatus ?? "")
    ? (rawStatus as ContactStatus)
    : "idle";

  const rawFields = first(params.fields)
    ?.split(",")
    .map((value) => value.trim())
    .filter((value): value is ContactField =>
      (CONTACT_FIELDS as readonly string[]).includes(value),
    );

  // Normalised even though the action already de-duplicates: this function parses
  // untrusted input, so it must be correct for any input, not only our own output.
  const fields = [...new Set(rawFields ?? [])].sort();

  return { status, fields };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
