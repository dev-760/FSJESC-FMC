"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authProvider } from "@/infrastructure/auth/auth-provider";
import { AppError } from "@fsjesc/config/errors";
import { logError, logInfo } from "@fsjesc/config/logger";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid academic or personal email"),
  password: z.string().min(1, "Password is required"),
  callbackUrl: z.string().optional(),
});

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid academic or personal email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Full name is required").max(100),
  studentId: z.string().max(50).optional(),
  track: z.string().max(100).optional(),
});

export async function signInAction(formData: FormData): Promise<never> {
  const email = stringField(formData, "email");
  const password = stringField(formData, "password");
  const callbackUrl = stringField(formData, "callbackUrl") || "/simulator";

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

  redirect(callbackUrl);
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

  redirect("/simulator?welcome=true");
}

export async function signOutAction(): Promise<never> {
  await authProvider.logOut();
  redirect("/");
}

function stringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function emailDomain(address: string): string {
  const at = address.lastIndexOf("@");
  return at >= 0 ? address.slice(at + 1) : "unknown";
}
