"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Minus, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle } from "lucide-react";
import { Num } from "../primitives/num";
import { cn } from "@fsjesc/config/cn";
import { commissionFor, type Side } from "@fsjesc/domain/trading/engine";
import type { SimOrderType } from "./simulator-store";

export interface OrderTicketProps {
  symbol: string;
  currentPriceCents: number;
  bidCents?: number;
  askCents?: number;
  availableCashCents: bigint;
  positionQuantity?: number;
  positionAvgCostCents?: number;
  onSubmit: (order: {
    side: Side;
    type: SimOrderType;
    quantity: number;
    limitCents?: number;
    stopCents?: number;
  }) => void;
  onClosePosition?: () => void;
}

export function OrderTicket({
  symbol,
  currentPriceCents,
  bidCents,
  askCents,
  availableCashCents,
  positionQuantity = 0,
  positionAvgCostCents = 0,
  onSubmit,
  onClosePosition,
}: OrderTicketProps) {
  const [side, setSide] = useState<Side>("BUY");
  const [type, setType] = useState<SimOrderType>("MARKET");
  const [quantity, setQuantity] = useState<number>(10);
  const [limitCents, setLimitCents] = useState<number>(currentPriceCents);
  const [stopCents, setStopCents] = useState<number>(currentPriceCents);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Sync default limit/stop price when symbol changes
  useEffect(() => {
    setLimitCents(currentPriceCents);
    setStopCents(currentPriceCents);
    setShowConfirmation(false);
  }, [symbol, currentPriceCents]);

  const effectiveBid = bidCents ?? Math.max(1, currentPriceCents - 5);
  const effectiveAsk = askCents ?? currentPriceCents + 5;

  const marketExecPrice = side === "BUY" ? effectiveAsk : effectiveBid;
  const effectivePriceCents =
    type === "LIMIT" ? limitCents : type === "STOP" ? stopCents : marketExecPrice;

  const depthSlippageTicks = type === "MARKET" ? Math.min(4, Math.floor(quantity / 250)) : 0;
  const slippageBps =
    effectivePriceCents > 0
      ? Math.round(((depthSlippageTicks * 5) / effectivePriceCents) * 10_000)
      : 0;

  const estimatedCost = BigInt(Math.max(0, quantity) * Math.max(0, effectivePriceCents));
  const fee = estimatedCost > 0n ? commissionFor(estimatedCost) : 0n;
  const total = side === "BUY" ? estimatedCost + fee : estimatedCost > fee ? estimatedCost - fee : 0n;

  const maxPossibleShares =
    side === "BUY"
      ? effectivePriceCents > 0
        ? Math.max(
            0,
            Math.floor(
              Number((availableCashCents * 10_000n) / (BigInt(effectivePriceCents) * 10_005n)),
            ),
          )
        : 0
      : positionQuantity;

  const canAfford =
    side === "BUY" ? total <= availableCashCents : quantity <= positionQuantity && positionQuantity > 0;
  const isValid =
    quantity > 0 &&
    (type === "MARKET" || (type === "LIMIT" && limitCents > 0) || (type === "STOP" && stopCents > 0));

  const handleShortcut = (pct: number) => {
    if (maxPossibleShares <= 0) return;
    const computed = Math.max(1, Math.floor((maxPossibleShares * pct) / 100));
    setQuantity(computed);
    setShowConfirmation(false);
  };

  const handleAdjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
    setShowConfirmation(false);
  };

  const applyQuickPrice = (multiplier: number) => {
    const target = Math.max(5, Math.round((currentPriceCents * multiplier) / 5) * 5);
    if (type === "LIMIT") setLimitCents(target);
    if (type === "STOP") setStopCents(target);
    setShowConfirmation(false);
  };

  const handleSubmit = useCallback(() => {
    if (!isValid || !canAfford) return;

    if (showConfirmation) {
      onSubmit({
        side,
        type,
        quantity,
        limitCents: type === "LIMIT" ? limitCents : undefined,
        stopCents: type === "STOP" ? stopCents : undefined,
      });
      setShowConfirmation(false);
    } else {
      setShowConfirmation(true);
    }
  }, [isValid, canAfford, showConfirmation, side, type, quantity, limitCents, stopCents, onSubmit]);

  const isLimitPending =
    type === "LIMIT" &&
    ((side === "BUY" && limitCents < effectiveAsk) ||
      (side === "SELL" && limitCents > effectiveBid));

  return (
    <div className="sim-card border border-[var(--sim-border)] bg-[var(--sim-bg-card)]">
      {/* Ticket Header */}
      <div className="sim-card__head bg-[var(--sim-bg-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="sim-card__title">Ticket d&apos;Ordre</h3>
            <span className="rounded-md bg-[var(--sim-navy)] px-2 py-0.5 font-mono text-[11px] font-bold text-[#f0d28a]">
              {symbol}
            </span>
          </div>
          <p className="sim-card__sub">Exécution Carnet L2 · Devise MAD</p>
        </div>
        <div className="text-right">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--sim-ink-3)]">
            Dernier Cours
          </span>
          <span className="font-mono text-sm font-bold text-[var(--sim-ink)]">
            {(currentPriceCents / 100).toFixed(2)} MAD
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Segmented Side Toggle: ACHAT / VENTE */}
        <div
          className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--sim-bg-muted)] p-1 border border-[var(--sim-border)]"
          role="group"
          aria-label="Sens de l'ordre"
        >
          <button
            type="button"
            onClick={() => {
              setSide("BUY");
              setShowConfirmation(false);
            }}
            aria-pressed={side === "BUY"}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold tracking-wide transition-all cursor-pointer",
              side === "BUY"
                ? "bg-[var(--sim-emerald)] text-white shadow-sm"
                : "text-[var(--sim-ink-2)] hover:text-[var(--sim-ink)]",
            )}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>ACHAT (BUY)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSide("SELL");
              setShowConfirmation(false);
            }}
            aria-pressed={side === "SELL"}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold tracking-wide transition-all cursor-pointer",
              side === "SELL"
                ? "bg-[var(--sim-terracotta)] text-white shadow-sm"
                : "text-[var(--sim-ink-2)] hover:text-[var(--sim-ink)]",
            )}
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>VENTE (SELL)</span>
          </button>
        </div>

        {/* Order Type Selector: Au marché / Cours limité / Stop */}
        <div
          className="grid grid-cols-3 gap-1 rounded-lg bg-[var(--sim-bg-subtle)] p-1 border border-[var(--sim-border)]"
          role="group"
          aria-label="Type d'ordre"
        >
          {(
            [
              { id: "MARKET", label: "Au marché" },
              { id: "LIMIT", label: "Cours limité" },
              { id: "STOP", label: "Stop" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setType(item.id);
                setShowConfirmation(false);
              }}
              aria-pressed={type === item.id}
              className={cn(
                "rounded-md py-1.5 px-2 text-xs font-semibold transition-all cursor-pointer",
                type === item.id
                  ? "bg-[var(--sim-bg-card)] text-[var(--sim-ink)] shadow-xs border border-[var(--sim-border-strong)]"
                  : "text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Quantity Input + Quick Sizing Pills (25% / 50% / 75% / MAX) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={`qty-${symbol}`}
              className="text-xs font-semibold text-[var(--sim-ink-2)]"
            >
              Quantité (Titres)
            </label>
            <span className="font-mono text-[11px] text-[var(--sim-ink-3)]">
              {side === "BUY" ? "Max achetable : " : "En portefeuille : "}
              <strong className="text-[var(--sim-ink)]">{maxPossibleShares}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAdjustQuantity(-1)}
              disabled={quantity <= 1}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] text-[var(--sim-ink)] hover:bg-[var(--sim-bg-muted)] disabled:opacity-40 cursor-pointer"
              aria-label="Diminuer la quantité"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <input
              id={`qty-${symbol}`}
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(Math.max(1, Number.parseInt(e.target.value, 10) || 1));
                setShowConfirmation(false);
              }}
              className="w-full rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-card)] px-3 py-2 font-mono text-center text-sm font-semibold text-[var(--sim-ink)] focus-visible:outline-2 focus-visible:outline-ring"
            />

            <button
              type="button"
              onClick={() => handleAdjustQuantity(1)}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] text-[var(--sim-ink)] hover:bg-[var(--sim-bg-muted)] cursor-pointer"
              aria-label="Augmenter la quantité"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Allocation Bar */}
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleShortcut(pct)}
                disabled={maxPossibleShares <= 0}
                className="rounded-md border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] py-1 font-mono text-[11px] font-semibold text-[var(--sim-ink-2)] hover:border-[var(--sim-gold)] hover:text-[var(--sim-ink)] transition-colors disabled:opacity-40 cursor-pointer"
              >
                {pct === 100 ? "MAX" : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Limit or Stop Price Input */}
        {type !== "MARKET" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor={`price-${symbol}`}
                className="text-xs font-semibold text-[var(--sim-ink-2)]"
              >
                {type === "LIMIT" ? "Cours Limité (MAD)" : "Seuil de Déclenchement Stop (MAD)"}
              </label>
              <span className="font-mono text-[10px] text-[var(--sim-ink-3)]">Pas : 0.05 MAD</span>
            </div>
            <div className="relative">
              <input
                id={`price-${symbol}`}
                type="number"
                min="0.05"
                step="0.05"
                value={((type === "LIMIT" ? limitCents : stopCents) / 100).toFixed(2)}
                onChange={(e) => {
                  const cents = Math.max(
                    5,
                    Math.round(Number.parseFloat(e.target.value || "0") * 100),
                  );
                  if (type === "LIMIT") setLimitCents(cents);
                  else setStopCents(cents);
                  setShowConfirmation(false);
                }}
                className="w-full rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-card)] px-3 py-2 pr-14 font-mono text-sm font-semibold text-[var(--sim-ink)] focus-visible:outline-2 focus-visible:outline-ring"
              />
              <span className="absolute right-3 top-2.5 font-mono text-xs text-[var(--sim-ink-3)]">
                MAD
              </span>
            </div>

            {/* Quick Limit/Stop Offset Pills */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[
                { label: "-2%", mult: 0.98 },
                { label: "-0.5%", mult: 0.995 },
                { label: "Marché", mult: 1.0 },
                { label: "+2%", mult: 1.02 },
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => applyQuickPrice(pill.mult)}
                  className="rounded border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] py-1 font-mono text-[10px] text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)] cursor-pointer"
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {isLimitPending && (
              <p className="mt-1.5 font-mono text-[11px] text-[var(--sim-amber)]">
                Cet ordre sera inscrit en attente dans le carnet L2 jusqu&apos;à atteinte du cours.
              </p>
            )}
          </div>
        )}

        {/* Cost, Commission & Slippage Breakdown */}
        <div className="rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--sim-ink-3)]">
              {type === "MARKET" ? "Cours estimé (Carnet L2)" : "Cours cible"}
            </span>
            <span className="font-mono font-semibold text-[var(--sim-ink)]">
              {(effectivePriceCents / 100).toFixed(2)} MAD
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--sim-ink-3)]">Montant brut</span>
            <Num cents={estimatedCost} size="xs" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--sim-ink-3)]">Commission BVC (5 bps)</span>
            <Num cents={fee} size="xs" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--sim-ink-3)]">Impact / Slippage estimé</span>
            <span className="font-mono text-[11px] text-[var(--sim-ink-2)]">
              {slippageBps > 0 ? `~${slippageBps} bps` : "< 1 bps (Top of book)"}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--sim-border)] pt-2 text-sm font-semibold">
            <span className="text-[var(--sim-ink)]">
              {side === "BUY" ? "Total à débiter" : "Produit net crédité"}
            </span>
            <Num
              cents={total}
              size="sm"
              tone={side === "BUY" ? "neutral" : "positive"}
            />
          </div>
        </div>

        {/* Account Balance & Position Context */}
        <div className="flex items-center justify-between text-xs px-1 text-[var(--sim-ink-3)]">
          <span>Liquidités disponibles :</span>
          <span className="font-mono font-semibold text-[var(--sim-ink)]">
            <Num cents={availableCashCents} size="xs" />
          </span>
        </div>

        {/* Validation Warning */}
        {!canAfford && (
          <div className="rounded-xl border border-[var(--sim-terracotta)]/40 bg-[var(--sim-terracotta-tint)] px-3 py-2.5 text-xs text-[var(--sim-terracotta)]">
            {side === "BUY"
              ? "Pouvoir d'achat insuffisant pour couvrir le montant + commission. Réduisez la quantité."
              : `Position insuffisante : vous détenez ${positionQuantity} titre(s) de ${symbol}.`}
          </div>
        )}

        {/* Confirmation Box */}
        {showConfirmation && (
          <div className="rounded-xl border border-[var(--sim-gold)] bg-[var(--sim-gold-tint)] p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--sim-ink)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--sim-emerald)]" />
              <span>Confirmer la transmission de l&apos;ordre</span>
            </div>
            <p className="text-[var(--sim-ink-2)] leading-relaxed">
              <strong>{side === "BUY" ? "ACHAT" : "VENTE"}</strong> de{" "}
              <strong className="font-mono">{quantity}</strong> {symbol} (
              {type === "MARKET"
                ? "Au marché"
                : `${type} @ ${(effectivePriceCents / 100).toFixed(2)} MAD`}
              ).
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="space-y-2">
          <button
            type="button"
            disabled={!isValid || !canAfford}
            onClick={handleSubmit}
            className={cn(
              "w-full rounded-xl py-2.5 px-4 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed",
              side === "BUY"
                ? "bg-[var(--sim-emerald)] hover:opacity-95"
                : "bg-[var(--sim-terracotta)] hover:opacity-95",
            )}
          >
            {showConfirmation
              ? `Confirmer ${side === "BUY" ? "l'achat" : "la vente"} (${quantity} ${symbol})`
              : `Transmettre l'ordre ${side === "BUY" ? "d'achat" : "de vente"}`}
          </button>

          {showConfirmation && (
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="w-full rounded-lg py-1.5 text-xs font-medium text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)] cursor-pointer"
            >
              Modifier les paramètres
            </button>
          )}
        </div>

        {/* Active Holding Box + 1-Click Close */}
        {positionQuantity > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--sim-border)] flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="block text-[11px] text-[var(--sim-ink-3)]">
                Position ouverte sur {symbol}
              </span>
              <span className="font-mono font-semibold text-[var(--sim-ink)]">
                {positionQuantity} titres
                {positionAvgCostCents > 0
                  ? ` · PRU ${(positionAvgCostCents / 100).toFixed(2)} MAD`
                  : ""}
              </span>
            </div>
            {onClosePosition && (
              <button
                type="button"
                onClick={onClosePosition}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--sim-terracotta)]/40 bg-[var(--sim-terracotta-tint)] px-2.5 py-1.5 text-xs font-semibold text-[var(--sim-terracotta)] hover:opacity-90 transition-opacity cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Clôturer</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
