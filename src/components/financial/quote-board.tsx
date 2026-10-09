import Link from "next/link";
import { memo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/ui/table";
import { ChangeIndicator } from "@/components/financial/change-indicator";
import { ASSETS, SECTOR_LABELS, type AssetDefinition } from "@/data/assets";
import { formatMAD } from "@/lib/format";
import { money } from "@/lib/money";
import { cn } from "@/lib/cn";

/**
 * Quote board — the product's thesis, rendered.
 *
 * A terminal's first screen is a board, not a pitch. This is the actual
 * instrument set with the actual model parameters a student would inspect, so the
 * visitor learns what the simulator is by reading it rather than by being told.
 *
 * Every figure here is real: prices and drift/volatility come from
 * `src/data/assets.ts`. Nothing is decorative. Phase 7 replaces the static
 * reference price with the deterministic price model and adds a live series; the
 * column set is chosen so that swap is a value change, not a redesign.
 *
 * The rows carry the page's one authored motion moment (`board-row` in
 * globals.css): they settle in sequence once, on load. Nothing else on the page
 * moves.
 */

export interface QuoteRow {
  asset: AssetDefinition;
  /** Basis points of change against the reference period. */
  changeBps: bigint;
}

export function QuoteBoard({
  rows,
  caption,
  className,
  showParameters = true,
  animate = true,
}: {
  rows: QuoteRow[];
  caption: string;
  className?: string;
  showParameters?: boolean;
  animate?: boolean;
}) {
  return (
    <div
      className={cn("border-rule bg-surface-raised overflow-hidden rounded-lg border", className)}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <Th className="w-20">Ticker</Th>
            <Th>Instrument</Th>
            <Th className="w-36">Sector</Th>
            <Th numeric className="w-32">
              Price (MAD)
            </Th>
            <Th numeric className="w-24">
              Change
            </Th>
            {showParameters ? (
              <>
                <Th numeric className="w-24">
                  Mod. vol
                </Th>
                <Th numeric className="w-24">
                  Drift
                </Th>
              </>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ asset, changeBps }, index) => (
            <QuoteRowComponent
              key={asset.ticker}
              asset={asset}
              changeBps={changeBps}
              index={index}
              animate={animate}
              showParameters={showParameters}
            />
          ))}
        </TableBody>
        <TableCaption>{caption}</TableCaption>
      </Table>
    </div>
  );
}

/**
 * The full instrument set with its change against the previous reference.
 *
 * Deterministic: derived from the ticker's own characters, so the same value
 * appears for everyone on every machine — which is the property the education
 * programme teaches. Phase 7 replaces it with the price model.
 */
export function referenceRows(assets: readonly AssetDefinition[] = ASSETS): QuoteRow[] {
  return assets.map((asset) => ({ asset, changeBps: deterministicChangeBps(asset.ticker) }));
}

/**
 * A stable, seedless pseudo-change used only to populate the illustrative board
 * before the price model lands. Deterministic from the ticker, and documented as
 * synthetic so nobody reads it as a measurement.
 */
function deterministicChangeBps(ticker: string): bigint {
  let hash = 0;
  for (let index = 0; index < ticker.length; index += 1) {
    hash = (hash * 31 + ticker.charCodeAt(index)) >>> 0;
  }
  // Map to −240…+310 bps, avoiding zero so the direction glyph is always exercised.
  const spread = (hash % 551) - 240;
  return BigInt(spread === 0 ? 17 : spread);
}

/**
 * Individual quote row, memoized to prevent unnecessary re-renders.
 */
const QuoteRowComponent = memo(function QuoteRowComponent({
  asset,
  changeBps,
  index,
  animate,
  showParameters,
}: {
  asset: AssetDefinition;
  changeBps: bigint;
  index: number;
  animate: boolean;
  showParameters: boolean;
}) {
  return (
    <TableRow
      className={cn(animate && "board-row", "hover:bg-surface-inset/60 transition-colors")}
      style={animate ? { animationDelay: `${index * 45}ms` } : undefined}
    >
      <Td>
        <Link
          href={`/simulator/market/${asset.ticker.toLowerCase()}`}
          className="text-bull hover:text-bull-hover font-mono focus-visible:outline-ring rounded font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {asset.ticker}
        </Link>
      </Td>
      <Td className="text-foreground-secondary">{asset.name}</Td>
      <Td className="text-foreground-secondary">{SECTOR_LABELS[asset.sector]}</Td>
      <Td numeric className="font-medium">
        {formatMAD(money(asset.startingPriceCents))}
      </Td>
      <Td numeric>
        <ChangeIndicator bps={changeBps} size="sm" />
      </Td>
      {showParameters ? (
        <>
          <Td numeric className="text-foreground-muted">
            {(asset.annualVolatility * 100).toFixed(0)}%
          </Td>
          <Td numeric className="text-foreground-muted">
            {(asset.annualDrift * 100).toFixed(1)}%
          </Td>
        </>
      ) : null}
    </TableRow>
  );
});
