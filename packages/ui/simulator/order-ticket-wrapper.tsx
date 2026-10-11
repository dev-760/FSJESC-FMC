/**
 * Order ticket wrapper component.
 *
 * Client component wrapper for OrderTicket that executes orders via /api/orders
 * and surfaces real-time execution feedback. Available cash is loaded from the
 * portfolio endpoint so the ticket reflects the member's actual balance.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { market } from "@fsjesc/domain/market/engine";
import { OrderTicket } from "./order-ticket";
import { Alert } from "../alert";

interface OrderTicketWrapperProps {
  symbol: string;
  currentPriceCents: number;
  /** Fallback used while the portfolio request is in flight, or for guests. */
  availableCashCents?: bigint;
}

interface PortfolioDto {
  cashCents?: string;
  positions?: Array<{
    symbol: string;
    quantity: number;
  }>;
}

export function OrderTicketWrapper({
  symbol,
  currentPriceCents,
  availableCashCents = 10_000_000n,
}: OrderTicketWrapperProps) {
  const [cashCents, setCashCents] = useState(availableCashCents);
  const [positionQuantity, setPositionQuantity] = useState(0);
  const [livePriceCents, setLivePriceCents] = useState(currentPriceCents);
  const [feedback, setFeedback] = useState<{
    tone: "positive" | "negative" | "warning";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep ticket price synced with the deterministic market engine
  useEffect(() => {
    const updateQuote = () => {
      try {
        const quote = market.getQuote(symbol, new Date());
        setLivePriceCents(Number(quote.lastCents));
      } catch {
        // Keep fallback price if symbol lookup fails
      }
    };
    updateQuote();
    const timer = setInterval(updateQuote, 3000);
    return () => clearInterval(timer);
  }, [symbol]);

  const loadPortfolio = useCallback(async () => {
    try {
      const response = await fetch("/api/simulator/portfolio", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as PortfolioDto;
      if (typeof data.cashCents === "string") {
        setCashCents(BigInt(data.cashCents));
      }
      if (Array.isArray(data.positions)) {
        const match = data.positions.find(
          (pos) => pos.symbol.toUpperCase() === symbol.toUpperCase(),
        );
        setPositionQuantity(match ? match.quantity : 0);
      }
    } catch {
      // Keep fallback state; the ticket remains usable.
    }
  }, [symbol]);

  useEffect(() => {
    void loadPortfolio();
  }, [loadPortfolio]);

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
        cashCents?: string;
      };

      if (!response.ok) {
        setFeedback({
          tone: "negative",
          message: data.error ?? "Order placement failed.",
        });
        return;
      }

      if (typeof data.cashCents === "string") {
        setCashCents(BigInt(data.cashCents));
      }
      await loadPortfolio();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("fsjesc:portfolio-updated"));
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
        currentPriceCents={livePriceCents}
        availableCashCents={cashCents}
        positionQuantity={positionQuantity}
        onSubmit={(order) => {
          void handleSubmit(order);
        }}
      />
      {isSubmitting && (
        <p className="text-foreground-muted animate-pulse text-center text-xs">
          Submitting order to matching engine...
        </p>
      )}
    </div>
  );
}
