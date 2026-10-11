"use client";

import { useEffect, useState } from "react";
import { market } from "@fsjesc/domain/market/engine";
import { OrderTicket } from "./order-ticket";
import { Alert } from "../alert";
import {
  submitSimulatorOrder,
  useSimulatorPortfolio,
  type SimOrderType,
} from "./simulator-store";

interface OrderTicketWrapperProps {
  symbol: string;
  currentPriceCents: number;
  availableCashCents?: bigint;
}

export function OrderTicketWrapper({
  symbol,
  currentPriceCents,
}: OrderTicketWrapperProps) {
  const { telemetry, closePosition, cancelOrder } = useSimulatorPortfolio(3000);
  const [quoteState, setQuoteState] = useState<{
    lastCents: number;
    bidCents: number;
    askCents: number;
  }>({
    lastCents: currentPriceCents,
    bidCents: Math.max(1, currentPriceCents - 5),
    askCents: currentPriceCents + 5,
  });

  const [feedback, setFeedback] = useState<{
    tone: "positive" | "negative" | "warning";
    message: string;
  } | null>(null);

  useEffect(() => {
    const updateQuote = () => {
      try {
        const q = market.getQuote(symbol, telemetry.effectiveDate);
        setQuoteState({
          lastCents: q.lastCents,
          bidCents: q.bidCents,
          askCents: q.askCents,
        });
      } catch {
        // Keep fallback
      }
    };
    updateQuote();
    const timer = setInterval(updateQuote, 3000);
    return () => clearInterval(timer);
  }, [symbol, telemetry.effectiveDate]);

  // Clear feedback banner when switching instruments
  useEffect(() => {
    setFeedback(null);
  }, [symbol]);

  const currentPosition = telemetry.positions.find(
    (p) => p.symbol.toUpperCase() === symbol.toUpperCase(),
  );
  const symbolPendingOrders = telemetry.pendingOrders.filter(
    (o) => o.symbol.toUpperCase() === symbol.toUpperCase(),
  );

  const handleSubmit = (order: {
    side: "BUY" | "SELL";
    type: SimOrderType;
    quantity: number;
    limitCents?: number;
    stopCents?: number;
  }) => {
    const res = submitSimulatorOrder({
      symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      limitCents: order.limitCents,
      stopCents: order.stopCents,
    });
    setFeedback({
      tone: res.tone,
      message: res.message,
    });
  };

  const handleClosePosition = () => {
    const res = closePosition(symbol, 1);
    setFeedback({
      tone: res.ok ? "positive" : "negative",
      message: res.message,
    });
  };

  return (
    <div className="space-y-3">
      {feedback && (
        <Alert tone={feedback.tone} assertive>
          <p className="text-xs font-medium">{feedback.message}</p>
        </Alert>
      )}

      <OrderTicket
        symbol={symbol}
        currentPriceCents={quoteState.lastCents}
        bidCents={quoteState.bidCents}
        askCents={quoteState.askCents}
        availableCashCents={telemetry.availableCashCents}
        positionQuantity={currentPosition?.quantity ?? 0}
        positionAvgCostCents={currentPosition?.averageCostCents ?? 0}
        onSubmit={handleSubmit}
        onClosePosition={currentPosition ? handleClosePosition : undefined}
      />

      {/* Working Orders for this symbol */}
      {symbolPendingOrders.length > 0 && (
        <div className="sim-card p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--sim-amber)]">
              Ordres en carnet ({symbolPendingOrders.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {symbolPendingOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] px-2.5 py-1.5 text-xs"
              >
                <div>
                  <span
                    className={
                      ord.side === "BUY"
                        ? "font-mono font-bold text-[var(--sim-emerald)]"
                        : "font-mono font-bold text-[var(--sim-terracotta)]"
                    }
                  >
                    {ord.side === "BUY" ? "ACHAT" : "VENTE"}
                  </span>{" "}
                  <span className="font-mono font-semibold text-[var(--sim-ink)]">
                    {ord.requested} {ord.symbol}
                  </span>
                  <span className="block font-mono text-[10px] text-[var(--sim-ink-3)]">
                    {ord.type} @ {(((ord.limitCents ?? ord.stopCents ?? 0)) / 100).toFixed(2)} MAD
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    cancelOrder(ord.id);
                    setFeedback({
                      tone: "warning",
                      message: `Ordre ${ord.id} sur ${ord.symbol} annulé.`,
                    });
                  }}
                  className="rounded border border-[var(--sim-border)] bg-[var(--sim-bg-card)] px-2 py-1 font-mono text-[10px] font-semibold text-[var(--sim-terracotta)] hover:bg-[var(--sim-terracotta-tint)] cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
