import { describe, expect, it } from "vitest";
import {
  CONTACT_FIELDS,
  CONTACT_FIELD_LABELS,
  CONTACT_STATUS_MESSAGES,
  CONTACT_TOPICS,
  contactSchema,
  parseContactResult,
} from "./contact";

/**
 * Server-side validation rules (N7).
 *
 * These are the authority. The form's HTML constraints mirror them so that
 * obvious mistakes are caught before a request is made, but a browser can be
 * bypassed and a client is never trusted — so the rules live here and are tested
 * here rather than being asserted only through the end-to-end suite.
 */

const VALID = {
  name: "Amina Benali",
  email: "amina@example.com",
  topic: "PROGRAMME" as const,
  message: "I would like to propose a session on cash flow statements for second year students.",
};

describe("contactSchema", () => {
  it("accepts a well-formed enquiry", () => {
    const parsed = contactSchema.parse(VALID);
    expect(parsed.name).toBe("Amina Benali");
    expect(parsed.email).toBe("amina@example.com");
    expect(parsed.topic).toBe("PROGRAMME");
  });

  it("trims surrounding whitespace", () => {
    const parsed = contactSchema.parse({
      ...VALID,
      name: "  Amina Benali  ",
      message: `  ${VALID.message}  `,
    });
    expect(parsed.name).toBe("Amina Benali");
    expect(parsed.message).toBe(VALID.message);
  });

  it("rejects a name that is blank or too short", () => {
    expect(contactSchema.safeParse({ ...VALID, name: "" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...VALID, name: "   " }).success).toBe(false);
    expect(contactSchema.safeParse({ ...VALID, name: "A" }).success).toBe(false);
  });

  it("rejects an implausibly long name", () => {
    expect(contactSchema.safeParse({ ...VALID, name: "a".repeat(121) }).success).toBe(false);
  });

  it("rejects a malformed address", () => {
    for (const email of ["not-an-email", "", "@example.com", "a@", "a b@example.com"]) {
      expect(contactSchema.safeParse({ ...VALID, email }).success, email).toBe(false);
    }
  });

  it("rejects an address longer than the RFC limit", () => {
    expect(
      contactSchema.safeParse({ ...VALID, email: `${"a".repeat(250)}@example.com` }).success,
    ).toBe(false);
  });

  it("accepts an address at the length limit", () => {
    const local = "a".repeat(64);
    expect(contactSchema.safeParse({ ...VALID, email: `${local}@example.com` }).success).toBe(true);
  });

  it("rejects an unknown topic", () => {
    expect(contactSchema.safeParse({ ...VALID, topic: "NONSENSE" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...VALID, topic: "" }).success).toBe(false);
  });

  it("accepts every advertised topic", () => {
    for (const topic of CONTACT_TOPICS) {
      expect(contactSchema.safeParse({ ...VALID, topic: topic.value }).success).toBe(true);
    }
  });

  it("rejects a message below or above the length bounds", () => {
    expect(contactSchema.safeParse({ ...VALID, message: "too short" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...VALID, message: "a".repeat(29) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...VALID, message: "a".repeat(30) }).success).toBe(true);
    expect(contactSchema.safeParse({ ...VALID, message: "a".repeat(4001) }).success).toBe(false);
  });

  it("reports every failing field at once, so a user fixes everything in one pass", () => {
    const result = contactSchema.safeParse({ name: "", email: "bad", topic: "X", message: "" });
    expect(result.success).toBe(false);
    if (result.success) return;

    const fields = new Set(result.error.issues.map((issue) => issue.path[0]));
    expect([...fields].sort()).toEqual(["email", "message", "name", "topic"]);
  });

  it("rejects an entirely absent payload", () => {
    expect(contactSchema.safeParse({}).success).toBe(false);
    expect(contactSchema.safeParse(undefined).success).toBe(false);
  });
});

describe("parseContactResult", () => {
  it("reads a known status and field list", () => {
    expect(parseContactResult({ status: "invalid", fields: "email,message" })).toEqual({
      status: "invalid",
      fields: ["email", "message"],
    });
  });

  it("defaults to idle when nothing is supplied", () => {
    expect(parseContactResult({})).toEqual({ status: "idle", fields: [] });
  });

  it("collapses an unknown status rather than rendering it", () => {
    // A hand-edited URL must not be able to inject a status the page trusts.
    expect(parseContactResult({ status: "<script>alert(1)</script>" }).status).toBe("idle");
    expect(parseContactResult({ status: "SUCCESS" }).status).toBe("idle");
  });

  it("drops unknown field names", () => {
    const result = parseContactResult({ status: "invalid", fields: "email,evil,__proto__" });
    expect(result.fields).toEqual(["email"]);
  });

  it("de-duplicates and sorts field names", () => {
    expect(parseContactResult({ status: "invalid", fields: "topic,email,topic" }).fields).toEqual([
      "email",
      "topic",
    ]);
  });

  it("takes only the first value when a parameter is repeated", () => {
    expect(
      parseContactResult({ status: ["received", "invalid"], fields: ["email", "name"] }),
    ).toEqual({ status: "received", fields: ["email"] });
  });

  it("handles empty values", () => {
    expect(parseContactResult({ status: "", fields: "" })).toEqual({ status: "idle", fields: [] });
  });
});

describe("fixed messages", () => {
  it("has a message for every field the form can report on", () => {
    for (const field of CONTACT_FIELDS) {
      expect(CONTACT_FIELD_LABELS[field]).toBeTruthy();
    }
  });

  it("has a message for every status", () => {
    expect(CONTACT_STATUS_MESSAGES.idle).toBe("");
    for (const status of ["received", "invalid", "failed"] as const) {
      expect(CONTACT_STATUS_MESSAGES[status]).toBeTruthy();
    }
  });

  it("never promises advice or a return", () => {
    const all = [
      ...Object.values(CONTACT_FIELD_LABELS),
      ...Object.values(CONTACT_STATUS_MESSAGES),
    ].join(" ");
    expect(all).not.toMatch(/guarantee|guaranteed|profit|returns?\b|investment advice/i);
  });
});
