/**
 * Order ticket component.
 *
 * Form for placing buy/sell orders with market/limit options.
 * Includes two-step confirmation, allocation shortcuts, and institutional styling.
 */

"use client";

import { useState, useCallback } from "react";
import { Plus, Minus, ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";
import { Button } from "../button";
import { Label } from "../label";
import { Alert } from "../alert";
import { Num } from "../primitives/num";
import { cn } from "@fsjesc/config/cn";
import type { Side, OrderType } from "@fsjesc/domain/trading/engine";

interface OrderTicketProps {
  symbol: string;
  currentPriceCents: number;
  availableCashCents: bigint;
  positionQuantity?: number;
  onSubmit: (order: { side: Side; type: OrderType; quantity: number; limitCents?: number }) => void;
}

export function OrderTicket({
  symbol,
  currentPriceCents,
  availableCashCents,
  positionQuantity = 0,
  onSubmit,
}: OrderTicketProps) {
  const [side, setSide] = useState<Side>("BUY");
  const [type, setType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState<number>(1);
  const [limitCents, setLimitCents] = useState<number>(currentPriceCents);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const effectivePriceCents = type === "LIMIT" ? limitCents : currentPriceCents;
  const estimatedCost = BigInt(quantity * effectivePriceCents);
  const fee = (estimatedCost * 5n) / 10000n; // 5 bps exchange fee
  const total = estimatedCost + fee;

  const canAfford = side === "BUY" ? total <= availableCashCents : quantity <= positionQuantity;
  const isValid = quantity > 0 && (type === "MARKET" || limitCents > 0);

  // Maximum shares user can afford or sell
  const maxPossibleShares =
    side === "BUY"
      ? effectivePriceCents > 0
        ? Math.max(0, Math.floor(Number((availableCashCents * 10000n) / (BigInt(effectivePriceCents) * 10005n))))
        : 0
      : positionQuantity;

  const handleShortcut = (pct: number) => {
    if (maxPossibleShares <= 0) return;
    const computed = Math.max(1, Math.floor((maxPossibleShares * pct) / 100));
    setQuantity(computed);
  };

  const handleAdjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    if (showConfirmation) {
      onSubmit({
        side,
        type,
        quantity,
        limitCents: type === "LIMIT" ? limitCents : undefined,
      });
      setShowConfirmation(false);
    } else {
      setShowConfirmation(true);
    }
  }, [isValid, showConfirmation, side, type, quantity, limitCents, onSubmit]);

  return (
    <div className="bg-surface-sunken rounded-lg border border-rule p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">Order Ticket</h3>
          <p className="label text-2xs text-foreground-secondary mt-0.5">{symbol} · Moroccan Dirham</p>
        </div>
        <span className="numeric text-xs font-semibold bg-surface-raised border border-rule px-2 py-0.5 rounded text-foreground">
          {(currentPriceCents / 100).toFixed(2)} MAD
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {/* Side toggle: Buy (Bull Green) vs Sell (Bear Red) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-raised rounded-md border border-rule" role="group" aria-label="Order side">
          <Button
            type="button"
            variant={side === "BUY" ? "bull" : "ghost"}
            size="sm"
            onClick={() => {
              setSide("BUY");
              setShowConfirmation(false);
            }}
            aria-pressed={side === "BUY"}
            className="flex items-center gap-1.5"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>BUY</span>
          </Button>
          <Button
            type="button"
            variant={side === "SELL" ? "bear" : "ghost"}
            size="sm"
            onClick={() => {
              setSide("SELL");
              setShowConfirmation(false);
            }}
            aria-pressed={side === "SELL"}
            className="flex items-center gap-1.5"
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>SELL</span>
          </Button>
        </div>

        {/* Order type: Market vs Limit */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-raised rounded-md border border-rule" role="group" aria-label="Order execution type">
          <button
            type="button"
            onClick={() => {
              setType("MARKET");
              setShowConfirmation(false);
            }}
            aria-pressed={type === "MARKET"}
            className={cn(
              "py-1.5 px-3 text-xs font-medium rounded transition-all cursor-pointer",
              type === "MARKET"
                ? "bg-surface-inset text-foreground font-semibold shadow-xs border border-rule-strong"
                : "text-foreground-secondary hover:text-foreground",
            )}
          >
            Market Order
          </button>
          <button
            type="button"
            onClick={() => {
              setType("LIMIT");
              setShowConfirmation(false);
            }}
            aria-pressed={type === "LIMIT"}
            className={cn(
              "py-1.5 px-3 text-xs font-medium rounded transition-all cursor-pointer",
              type === "LIMIT"
                ? "bg-surface-inset text-foreground font-semibold shadow-xs border border-rule-strong"
                : "text-foreground-secondary hover:text-foreground",
            )}
          >
            Limit Order
          </button>
        </div>

        {/* Quantity with shortcuts and stepper */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="quantity" className="text-xs">Quantity (Shares)</Label>
            <span className="text-2xs text-foreground-muted">
              {side === "BUY" ? "Max affordable: " : "In portfolio: "}
              <strong className="numeric text-foreground">{maxPossibleShares}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAdjustQuantity(-1)}
              disabled={quantity <= 1}
              className="h-9 w-9 flex items-center justify-center rounded-md border border-rule bg-surface-raised text-foreground hover:bg-surface-inset disabled:opacity-40 cursor-pointer"
              aria-label="Decrease shares"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 0))}
              className="bg-surface-raised border border-rule w-full rounded-md px-3 py-2 font-mono text-center text-sm focus-visible:outline-2 focus-visible:outline-ring"
              aria-describedby="quantity-description"
            />

            <button
              type="button"
              onClick={() => handleAdjustQuantity(1)}
              className="h-9 w-9 flex items-center justify-center rounded-md border border-rule bg-surface-raised text-foreground hover:bg-surface-inset cursor-pointer"
              aria-label="Increase shares"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Allocation Shortcuts */}
          <div className="flex items-center gap-1.5 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleShortcut(pct)}
                disabled={maxPossibleShares <= 0}
                className="flex-1 py-1 text-2xs numeric rounded bg-surface-raised border border-rule text-foreground-secondary hover:text-foreground hover:bg-surface-inset transition-colors disabled:opacity-40 cursor-pointer"
              >
                {pct === 100 ? "MAX" : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Limit price input */}
        {type === "LIMIT" && (
          <div>
            <Label htmlFor="limit" className="text-xs mb-1.5 block">Limit Price (MAD)</Label>
            <div className="relative">
              <input
                id="limit"
                type="number"
                min="0.01"
                step="0.05"
                value={(limitCents / 100).toFixed(2)}
                onChange={(e) => setLimitCents(Math.max(5, Math.round(Number.parseFloat(e.target.value || "0") * 100)))}
                className="bg-surface-raised border border-rule w-full rounded-md px-3 py-2 font-mono text-sm focus-visible:outline-2 focus-visible:outline-ring"
                aria-describedby="limit-description"
              />
              <span className="absolute right-3 top-2.5 text-xs text-foreground-muted font-mono">MAD</span>
            </div>
            <p id="limit-description" className="text-foreground-muted text-2xs mt-1">
              Minimum tick size: 0.05 MAD
            </p>
          </div>
        )}

        {/* Cost and Fee Breakdown */}
        <div className="border-t border-rule space-y-1.5 pt-3 bg-surface/50 p-2.5 rounded border border-rule/50">
          <div className="flex justify-between text-xs">
            <span className="text-foreground-secondary">Gross Value</span>
            <Num cents={estimatedCost} size="xs" />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-foreground-secondary">Exchange Fee (0.05%)</span>
            <Num cents={fee} size="xs" />
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-rule/50 pt-1.5">
            <span className="text-foreground">Net Total Required</span>
            <Num cents={total} size="sm" tone={side === "BUY" ? "positive" : "neutral"} />
          </div>
        </div>

        {/* Available Cash / Position Info */}
        <div className="text-xs flex items-center justify-between text-foreground-secondary px-1">
          <span>{side === "BUY" ? "Available Cash:" : "Current Holding:"}</span>
          <span className="numeric font-medium text-foreground">
            {side === "BUY" ? <Num cents={availableCashCents} size="xs" /> : `${positionQuantity} shares`}
          </span>
        </div>

        {/* Validation warning */}
        {!canAfford && (
          <Alert tone="warning">
            <p className="text-xs">
              {side === "BUY"
                ? "Insufficient buying power for this order. Reduce quantity or sell other holdings."
                : `Insufficient shares. You only hold ${positionQuantity} share(s) of ${symbol}.`}
            </p>
          </Alert>
        )}

        {/* Confirmation review box */}
        {showConfirmation && (
          <div className="rounded-md border border-rule-strong bg-surface-raised p-3 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <CheckCircle2 className="h-4 w-4 text-bull" />
              <span>Confirm Order Submission</span>
            </div>
            <p className="text-foreground-secondary leading-relaxed">
              You are about to execute a <strong className={side === "BUY" ? "text-bull" : "text-bear"}>{side}</strong> order for{" "}
              <strong className="text-foreground">{quantity}</strong> share(s) of <strong className="text-foreground">{symbol}</strong> at{" "}
              <strong>{type === "LIMIT" ? `${(limitCents / 100).toFixed(2)} MAD (LIMIT)` : "BEST MARKET PRICE"}</strong>.
            </p>
          </div>
        )}

        {/* Submit Actions */}
        <div className="space-y-2 pt-1">
          <Button
            type="button"
            variant={side === "BUY" ? "bull" : "bear"}
            className="w-full text-sm font-semibold h-10 shadow-sm"
            disabled={!isValid || !canAfford}
            onClick={handleSubmit}
          >
            {showConfirmation ? `Confirm ${side} Order` : `Review ${side} Order`}
          </Button>

          {showConfirmation && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs text-foreground-secondary"
              onClick={() => setShowConfirmation(false)}
            >
              Cancel & Modify
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
