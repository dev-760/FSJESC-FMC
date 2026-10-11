"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authProvider } from "@/infrastructure/auth/auth-provider";
import { AppError } from "@fsjesc/config/errors";
import { safeCallbackUrl, simulatorUrl } from "@fsjesc/config/app-urls";
import { AUTH_CONFIG } from "@fsjesc/config/site";
import { logError, logInfo } from "@fsjesc/config/logger";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid academic or personal email"),
  password: z.string().min(1, "Password is required"),
  callbackUrl: z.string().optional(),
});

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid academic or personal email"),
  password: z
    .string()
    .min(AUTH_CONFIG.minPasswordLength, `Password must be at least ${AUTH_CONFIG.minPasswordLength} characters`)
    .max(AUTH_CONFIG.maxPasswordLength),
  name: z.string().min(1, "Full name is required").max(100),
  studentId: z.string().max(50).optional(),
  track: z.string().max(100).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(AUTH_CONFIG.minPasswordLength, `Password must be at least ${AUTH_CONFIG.minPasswordLength} characters`)
    .max(AUTH_CONFIG.maxPasswordLength),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export async function signInAction(formData: FormData): Promise<never> {
  const email = stringField(formData, "email");
  const password = stringField(formData, "password");
  const defaultDest = simulatorUrl();
  const callbackUrl = safeCallbackUrl(stringField(formData, "callbackUrl") || undefined, defaultDest);

  const validation = signInSchema.safeParse({ email, password, callbackUrl });

  if (!validation.success) {
    redirect(`/sign-in?status=invalid&message=${encodeURIComponent("Please enter a valid email and password")}`);
  }

  try {
    await authProvider.logIn({ email: validation.data.email, password: validation.data.password });
    logInfo("auth.signin.success", { domain: emailDomain(validation.data.email) });
  } catch (err) {
    logError("auth.signin.failed", err);
    const message = err instanceof AppError ? err.message : "Invalid email or password";
    redirect(`/sign-in?status=failed&message=${encodeURIComponent(message)}`);
  }

  redirect(safeCallbackUrl(validation.data.callbackUrl, defaultDest));
}

export async function signUpAction(formData: FormData): Promise<never> {
  const email = stringField(formData, "email");
  const password = stringField(formData, "password");
  const name = stringField(formData, "name");
  const studentId = stringField(formData, "studentId");
  const track = stringField(formData, "track");

  const validation = signUpSchema.safeParse({
    email,
    password,
    name,
    studentId: studentId || undefined,
    track: track || undefined,
  });

  if (!validation.success) {
    const firstIssue = validation.error.issues[0]?.message || "Invalid registration information";
    redirect(`/create-account?status=invalid&message=${encodeURIComponent(firstIssue)}`);
  }

  try {
    await authProvider.signUp({
      email: validation.data.email,
      password: validation.data.password,
      profile: {
        name: validation.data.name,
        studentId: validation.data.studentId,
        track: validation.data.track,
      },
    });
    logInfo("auth.signup.success", { domain: emailDomain(validation.data.email) });
  } catch (err) {
    logError("auth.signup.failed", err);
    const message = err instanceof AppError ? err.message : "Failed to create account. Please try again.";
    redirect(`/create-account?status=failed&message=${encodeURIComponent(message)}`);
  }

  redirect(simulatorUrl("?welcome=true"));
}

export async function signOutAction(): Promise<never> {
  await authProvider.logOut();
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData): Promise<never> {
  const email = stringField(formData, "email");
  const validation = forgotPasswordSchema.safeParse({ email });

  if (!validation.success) {
    redirect(
      `/forgot-password?status=invalid&message=${encodeURIComponent("Please enter a valid email address")}`,
    );
  }

  try {
    await authProvider.requestPasswordReset(validation.data.email);
    logInfo("auth.password_reset.requested", { domain: emailDomain(validation.data.email) });
  } catch (err) {
    logError("auth.password_reset.failed", err);
    const message =
      err instanceof AppError
        ? err.message
        : "Could not process the reset request. Please try again shortly.";
    redirect(`/forgot-password?status=failed&message=${encodeURIComponent(message)}`);
  }

  // Always show success — never reveal whether the address is registered.
  redirect("/forgot-password?status=sent");
}

export async function resetPasswordAction(formData: FormData): Promise<never> {
  const token = stringField(formData, "token");
  const password = stringField(formData, "password");
  const validation = resetPasswordSchema.safeParse({ token, password });

  if (!validation.success) {
    const firstIssue = validation.error.issues[0]?.message || "Invalid reset request";
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&status=invalid&message=${encodeURIComponent(firstIssue)}`,
    );
  }

  try {
    await authProvider.confirmPasswordReset({
      token: validation.data.token,
      newPassword: validation.data.password,
    });
    logInfo("auth.password_reset.confirmed", {});
  } catch (err) {
    logError("auth.password_reset.confirm_failed", err);
    const message =
      err instanceof AppError ? err.message : "This reset link is invalid or has expired.";
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&status=failed&message=${encodeURIComponent(message)}`,
    );
  }

  redirect("/sign-in?status=reset");
}

export async function verifyEmailAction(formData: FormData): Promise<never> {
  const token = stringField(formData, "token");
  const validation = verifyEmailSchema.safeParse({ token });

  if (!validation.success) {
    redirect(`/verify-email?status=failed&message=${encodeURIComponent("This verification link is incomplete.")}`);
  }

  try {
    await authProvider.verifyEmail(validation.data.token);
    logInfo("auth.email_verified", {});
  } catch (err) {
    logError("auth.email_verify.failed", err);
    const message =
      err instanceof AppError ? err.message : "This verification link is invalid or has expired.";
    redirect(`/verify-email?status=failed&message=${encodeURIComponent(message)}`);
  }

  redirect("/sign-in?status=verified");
}

function stringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function emailDomain(address: string): string {
  const at = address.lastIndexOf("@");
  return at >= 0 ? address.slice(at + 1) : "unknown";
}
