import { submitContactMessage } from "@/application/contact/actions";
import {
  CONTACT_TOPICS,
  CONTACT_FIELD_LABELS,
  CONTACT_STATUS_MESSAGES,
  type ContactField,
  type ContactStatus,
} from "@/domain/education/contact";

/**
 * Contact form.
 *
 * A Server Component with a native `<form action>`. No Client Component, no
 * `useActionState`, no `useFormStatus` — see the comment on the action for why.
 *
 * Consequences that are deliberate:
 *   - The form works with JavaScript disabled; the Server Action still validates.
 *   - The browser's own constraint validation is left **on** (no `noValidate`), so
 *     an empty required field, a malformed address, or a message under the
 *     minimum length is blocked before a request is ever made. The server remains
 *     the authority — these attributes mirror the Zod schema, they do not replace it.
 *   - There is no in-flight spinner. The browser's own navigation indicator is the
 *     feedback, which is honest rather than simulated.
 *   - A server-side rejection navigates back via redirect, which does not restore
 *     a typed draft. Because browser validation catches the cases a user would
 *     actually hit, this path is reached only when the constraint sets disagree.
 *     Recorded in DECISIONS.md D16.
 */
export function ContactForm({
  status,
  invalidFields,
}: {
  status: ContactStatus;
  invalidFields: readonly ContactField[];
}) {
  const hasError = status === "invalid" || status === "failed";
  const failed = (field: ContactField): string | undefined =>
    status === "invalid" && invalidFields.includes(field) ? CONTACT_FIELD_LABELS[field] : undefined;

  if (status === "received") {
    return (
      <div
        role="status"
        className="border-positive/30 bg-positive-subtle text-foreground rounded-md border px-4 py-3 text-sm"
      >
        <p className="text-foreground font-medium">{CONTACT_STATUS_MESSAGES.received}</p>
      </div>
    );
  }

  return (
    <form action={submitContactMessage} id="contact-form" className="space-y-5">
      {hasError ? (
        <div
          role="alert"
          className="border-negative/40 bg-negative-subtle text-foreground rounded-md border px-4 py-3 text-sm"
        >
          <p className="text-foreground font-medium">{CONTACT_STATUS_MESSAGES[status]}</p>
        </div>
      ) : null}

      <input type="hidden" name="intent" value="contact" />

      <Field
        id="contact-name"
        label="Your name"
        required
        error={failed("name")}
        hint="So we know who we are replying to."
      >
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          aria-invalid={failed("name") ? true : undefined}
          aria-describedby="contact-name-hint"
          className={controlClass}
        />
      </Field>

      <Field id="contact-email" label="Email address" required error={failed("email")}>
        <input
          id="contact-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          aria-invalid={failed("email") ? true : undefined}
          className={controlClass}
        />
      </Field>

      <Field id="contact-topic" label="What is this about?" required error={failed("topic")}>
        <select
          id="contact-topic"
          name="topic"
          required
          aria-invalid={failed("topic") ? true : undefined}
          className={`${controlClass} cursor-pointer`}
          defaultValue=""
        >
          <option value="" disabled>
            Choose a topic
          </option>
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="contact-message"
        label="Message"
        required
        error={failed("message")}
        hint="Include the topic, your level, and any timing constraints. At least 30 characters."
        hintId="contact-message-hint"
      >
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          minLength={30}
          maxLength={4000}
          aria-invalid={failed("message") ? true : undefined}
          aria-describedby="contact-message-hint"
          className={`${controlClass} py-2`}
        />
      </Field>

      <button
        type="submit"
        className="bg-accent hover:bg-accent-hover focus-visible:outline-ring inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Send message
      </button>
    </form>
  );
}

const controlClass =
  "w-full rounded-md border border-rule-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-surface-raised disabled:opacity-60 aria-[invalid=true]:border-negative";

function Field({
  id,
  label,
  children,
  required,
  error,
  hint,
  hintId,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  hintId?: string;
}) {
  const hintElementId = hintId ?? `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-foreground block text-sm font-medium">
        {label}
        {required ? (
          <>
            <span aria-hidden className="text-negative ml-0.5">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {hint ? (
        <p id={hintElementId} className="text-foreground-secondary text-xs">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} className="text-negative text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
