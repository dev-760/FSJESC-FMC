/**
 * Admin orders & risk desk API route (`/api/admin/orders`).
 *
 * Supports:
 * - GET: List all orders normalized for the AMS Order & Risk Desk
 * - POST: Place an administrative desk/test order on any of the 110 instruments
 * - PATCH: Cancel a pending order, force-fill a limit order, or reject an order
 */

import { type NextRequest, NextResponse } from "next/server";
import { findMarketAsset } from "@fsjesc/domain/assets";
import { db } from "@/infrastructure/database/connection";
import * as schema from "@/infrastructure/database/schema";
import { AppError } from "@fsjesc/config/errors";
import {
  authorizeAdminRequest,
  getAdminState,
  recordAdminActivity,
  type AdminOrderRecord,
} from "@/infrastructure/admin/store";

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request);
    const state = getAdminState();

    try {
      const dbOrders = await db.select().from(schema.orders).orderBy(schema.orders.placedAt);
      if (dbOrders.length > 0) {
        const mapped: AdminOrderRecord[] = dbOrders.map((o) => {
          const asset = findMarketAsset(o.symbol);
          return {
            id: o.id,
            userEmail: "member@fsjesc.uh2c.ma",
            symbol: o.symbol,
            market: asset?.market ?? "CSE",
            side: (o.side.toUpperCase() as "BUY" | "SELL") || "BUY",
            orderType: (o.type.toUpperCase() as "MARKET" | "LIMIT") || "MARKET",
            quantity: o.requested,
            filledPriceCents: o.averageFillCents
              ? String(Math.round(Number(o.averageFillCents)))
              : null,
            limitPriceCents: o.limitCents ? String(Math.round(Number(o.limitCents))) : null,
            feeCents: String(Math.round(Number(o.feeCents || 0))),
            status: (o.status.toUpperCase() as AdminOrderRecord["status"]) || "FILLED",
            reason: o.reason,
            createdAt: o.placedAt.toISOString(),
          };
        });
        return NextResponse.json([...state.orders, ...mapped]);
      }
    } catch {
      // Fallback to in-memory admin store
    }

    return NextResponse.json(state.orders);
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

export async function POST(request: NextRequest) {
  try {
    const admin = await authorizeAdminRequest(request);
    const body = (await request.json()) as {
      symbol?: string;
      side?: "BUY" | "SELL";
      orderType?: "MARKET" | "LIMIT";
      quantity?: number;
      limitPriceMad?: number;
    };

    const symbol = (body.symbol ?? "ATW").trim().toUpperCase();
    const asset = findMarketAsset(symbol);
    const quantity = Math.max(1, Number(body.quantity) || 10);
    const side = body.side ?? "BUY";
    const orderType = body.orderType ?? "MARKET";
    const refPriceCents = asset?.startingPriceCents ?? 48500;
    const limitCents =
      orderType === "LIMIT" && body.limitPriceMad
        ? Math.round(body.limitPriceMad * 100)
        : refPriceCents;

    const isImmediateFill = orderType === "MARKET";
    const notionalCents = (isImmediateFill ? refPriceCents : limitCents) * quantity;
    const feeCents = isImmediateFill ? Math.max(1500, Math.round(notionalCents * 0.001)) : 0;

    const newOrder: AdminOrderRecord = {
      id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      userEmail: admin.email,
      symbol: asset?.ticker ?? symbol,
      market: asset?.market ?? "CSE",
      side,
      orderType,
      quantity,
      filledPriceCents: isImmediateFill ? String(refPriceCents) : null,
      limitPriceCents: orderType === "LIMIT" ? String(limitCents) : null,
      feeCents: String(feeCents),
      status: isImmediateFill ? "FILLED" : "PENDING",
      reason: isImmediateFill ? "Executed via AMS Desk Order Ticket" : "Working limit order on desk book",
      createdAt: new Date().toISOString(),
    };

    const state = getAdminState();
    state.orders.unshift(newOrder);

    recordAdminActivity(
      "DESK_ORDER_SUBMITTED",
      `Submitted desk ${side} ${quantity} ${newOrder.symbol} (${newOrder.market}) [${newOrder.orderType} -> ${newOrder.status}]`,
      admin.email,
    );

    return NextResponse.json(newOrder, { status: 201 });
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
    const body = (await request.json()) as {
      id?: string;
      status?: AdminOrderRecord["status"];
      reason?: string;
    };

    if (!body.id || !body.status) {
      return NextResponse.json({ error: "Order id and target status are required" }, { status: 400 });
    }

    const state = getAdminState();
    const order = state.orders.find((o) => o.id === body.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    order.status = body.status;
    if (body.status === "FILLED" && !order.filledPriceCents) {
      const asset = findMarketAsset(order.symbol);
      order.filledPriceCents = order.limitPriceCents ?? String(asset?.startingPriceCents ?? 10000);
    }
    if (body.reason) {
      order.reason = body.reason;
    }

    recordAdminActivity(
      "ORDER_STATUS_CHANGED",
      `Changed order ${order.id} (${order.side} ${order.quantity} ${order.symbol}) to ${order.status}`,
      admin.email,
    );

    return NextResponse.json(order);
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
