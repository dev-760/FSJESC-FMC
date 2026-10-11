/**
 * Admin Platform Settings API route (`/api/admin/settings`).
 *
 * Manages general organization settings, simulator trading engine parameters,
 * API gateway timeouts/caching, and platform feature flags.
 */

import { type NextRequest, NextResponse } from "next/server";
import { AppError } from "@fsjesc/config/errors";
import {
  authorizeAdminRequest,
  getAdminState,
  recordAdminActivity,
  type PlatformSettings,
} from "@/infrastructure/admin/store";

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request);
    const state = getAdminState();
    return NextResponse.json(state.settings);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await authorizeAdminRequest(request);
    const updates = (await request.json()) as Partial<PlatformSettings>;
    const state = getAdminState();

    state.settings = {
      ...state.settings,
      ...updates,
    };

    const changedKeys = Object.keys(updates).join(", ");
    recordAdminActivity(
      "SETTINGS_UPDATED",
      `Updated platform settings (${changedKeys || "general configuration"})`,
      admin.email,
    );

    return NextResponse.json(state.settings);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
