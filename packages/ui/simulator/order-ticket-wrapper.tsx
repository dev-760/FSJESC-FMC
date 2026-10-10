/**
 * Order ticket wrapper component.
 *
 * Client component wrapper for OrderTicket that executes orders via /api/orders
 * and surfaces real-time execution feedback.
 */

"use client";

import { useState } from "react";
import { OrderTicket } from "./order-ticket";
import { Alert } from "../alert";

interface OrderTicketWrapperProps {
  symbol: string;
  currentPriceCents: number;
  availableCashCents: bigint;
}

export function OrderTicketWrapper({
  symbol,
  currentPriceCents,
  availableCashCents,
}: OrderTicketWrapperProps) {
  const [feedback, setFeedback] = useState<{
    tone: "positive" | "negative" | "warning";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (order: {
    side: "BUY" | "SELL";
    type: "MARKET" | "LIMIT";
    quantity: number;
    limitCents?: number;
  }) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          side: order.side,
          type: order.type,
          quantity: order.quantity,
          limitCents: order.limitCents,
          idempotencyKey: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        order?: { status?: string; reason?: string };
        messages?: string[];
      };

      if (!response.ok) {
        setFeedback({
          tone: "negative",
          message: data.error ?? "Order placement failed.",
        });
        return;
      }

      const orderStatus = data.order?.status;
      const firstMsg = data.messages?.[0] ?? `Order ${orderStatus ?? "processed"} successfully.`;

      if (orderStatus === "FILLED") {
        setFeedback({ tone: "positive", message: firstMsg });
      } else if (orderStatus === "PARTIAL") {
        setFeedback({ tone: "warning", message: firstMsg });
      } else {
        setFeedback({ tone: "negative", message: data.order?.reason ?? firstMsg });
      }
    } catch {
      setFeedback({
        tone: "negative",
        message: "Network error occurred while submitting order.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <Alert tone={feedback.tone} assertive>
          <p className="text-sm font-medium">{feedback.message}</p>
        </Alert>
      )}
      <OrderTicket
        symbol={symbol}
        currentPriceCents={currentPriceCents}
        availableCashCents={availableCashCents}
        onSubmit={(order) => {
          void handleSubmit(order);
        }}
      />
      {isSubmitting && (
        <p className="text-xs text-foreground-muted text-center animate-pulse">
          Submitting order to matching engine...
        </p>
      )}
    </div>
  );
}
