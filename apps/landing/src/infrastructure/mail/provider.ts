/**
 * Mail provider (Part 7.3).
 *
 * `console` is the local-development default: messages are written to the
 * operational log without ever printing a credential or a raw token. `smtp`
 * is required in production (enforced by `getServerEnv()`).
 */

import "server-only";
import nodemailer from "nodemailer";
import { getServerEnv } from "@fsjesc/config/env";
import { logInfo, logWarn } from "@fsjesc/config/logger";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailProvider {
  send(message: MailMessage): Promise<void>;
}

class ConsoleMailProvider implements MailProvider {
  send(message: MailMessage): Promise<void> {
    const at = message.to.lastIndexOf("@");
    const domain = at >= 0 ? message.to.slice(at + 1) : "unknown";
    logInfo("mail.console.delivered", {
      domain,
      subject: message.subject,
      // Development aid: the body is logged so a reset / verification link can
      // be copied from the server console. Never enable this for production —
      // `getServerEnv()` rejects MAIL_PROVIDER=console when NODE_ENV=production.
      body: message.text,
    });
    return Promise.resolve();
  }
}

class SmtpMailProvider implements MailProvider {
  private readonly transporter: ReturnType<typeof nodemailer.createTransport>;
  private readonly from: string;

  constructor(smtpUrl: string, from: string) {
    this.transporter = nodemailer.createTransport(smtpUrl);
    this.from = from;
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    const at = message.to.lastIndexOf("@");
    logInfo("mail.smtp.delivered", {
      domain: at >= 0 ? message.to.slice(at + 1) : "unknown",
      subject: message.subject,
    });
  }
}

let cached: MailProvider | undefined;

export function getMailProvider(): MailProvider {
  if (cached) return cached;

  const env = getServerEnv();
  if (env.MAIL_PROVIDER === "smtp") {
    if (!env.SMTP_URL) {
      logWarn("mail.smtp.missing_url", {});
      throw new Error("SMTP_URL is required when MAIL_PROVIDER=smtp");
    }
    cached = new SmtpMailProvider(env.SMTP_URL, env.MAIL_FROM);
  } else {
    cached = new ConsoleMailProvider();
  }

  return cached;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const mail = getMailProvider();
  await mail.send({
    to,
    subject: "Reset your FSJESC FMC password",
    text: [
      "You requested a password reset for your FSJESC Financial Markets Club account.",
      "",
      `Open this link to choose a new password (expires in 30 minutes):`,
      resetUrl,
      "",
      "If you did not request this, you can ignore this message. Your password will not change.",
    ].join("\n"),
    html: `
      <p>You requested a password reset for your FSJESC Financial Markets Club account.</p>
      <p><a href="${resetUrl}">Choose a new password</a> (expires in 30 minutes).</p>
      <p>If you did not request this, you can ignore this message. Your password will not change.</p>
    `.trim(),
  });
}

export async function sendContactEnquiryEmail(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
  notifyTo: string;
}): Promise<void> {
  const mail = getMailProvider();
  await mail.send({
    to: input.notifyTo,
    subject: `[FSJESC FMC contact] ${input.topic}`,
    text: [
      `From: ${input.name} <${input.email}>`,
      `Topic: ${input.topic}`,
      "",
      input.message,
    ].join("\n"),
  });
}
