"use server";

import { redirect } from "next/navigation";
import { contactSchema, type ContactInput } from "@fsjesc/domain/education/contact";
import { getServerEnv } from "@fsjesc/config/env";
import { logError, logInfo } from "@fsjesc/config/logger";
import { sendContactEnquiryEmail } from "@/infrastructure/mail/provider";

/**
 * Contact form action.
 *
 * Deliberately a plain Server Action invoked through a native `<form action>`,
 * with **no Client Component**. Three reasons, in order of weight:
 *
 * 1. Performance (Part 10). The measured framework floor for initial JavaScript on
 *    this stack is 190 KB gzip. `useActionState` adds ~32 KB on top because it
 *    pulls in React's form-action runtime. A form with no client component keeps
 *    `/contact` inside the 200 KB budget, and the check in `scripts/perf-budget.mjs`
 *    is what surfaced this.
 *
 * 2. Progressive enhancement. Without JavaScript the form still submits and the
 *    server still validates. A JS-only form simply fails open to no behaviour at
 *    all.
 *
 * 3. Input preservation without client state. On failure the page re-renders the
 *    same document the POST went to, and the values are still in the browser's
 *    repaint. No flash cookie and no state store are needed because there is no
 *    client-side navigation to preserve them across.
 *
 * The result is carried back as a short status code in the query string. Field
 * error text is rendered from a fixed table on the server, so nothing derived from
 * the submission is echoed through the URL.
 *
 * Server Actions are POST-only and Next.js compares `Origin` against `Host` before
 * invoking the function, which is the framework's CSRF posture (Part 8.8).
 */
export async function submitContactMessage(formData: FormData): Promise<never> {
  const submitted: ContactInput = {
    name: stringField(formData, "name"),
    email: stringField(formData, "email"),
    topic: stringField(formData, "topic") as ContactInput["topic"],
    message: stringField(formData, "message"),
  };

  const parsed = contactSchema.safeParse(submitted);

  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "")))]
      .filter(Boolean)
      .sort()
      .join(",");

    redirect(`/contact?status=invalid&fields=${encodeURIComponent(fields)}#contact-form`);
  }

  try {
    await deliverEnquiry(parsed.data);
  } catch (error) {
    logError("contact.enquiry.failed", error);
    redirect("/contact?status=failed#contact-form");
  }

  redirect("/contact?status=received");
}

function stringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function emailDomain(address: string): string {
  const at = address.lastIndexOf("@");
  return at >= 0 ? address.slice(at + 1) : "unknown";
}

/**
 * Delivers a validated enquiry to the club inbox via the mail provider.
 *
 * Only the email domain is written to the operational log — never the full
 * address. Durable storage in `audit_log` / an enquiries table remains a
 * follow-up; delivery itself is no longer a no-op.
 */
async function deliverEnquiry(input: ContactInput): Promise<void> {
  const env = getServerEnv();
  const notifyTo =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@fsjesc-fmc.local";

  logInfo("contact.enquiry.validated", {
    topic: input.topic,
    domain: emailDomain(input.email),
    mailProvider: env.MAIL_PROVIDER,
  });

  await sendContactEnquiryEmail({
    name: input.name,
    email: input.email,
    topic: input.topic,
    message: input.message,
    notifyTo,
  });
}
