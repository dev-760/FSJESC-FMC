import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { SimulatorNav } from "@fsjesc/ui/simulator/simulator-nav";
import { MarketBoard } from "./market-board";

export const metadata: Metadata = {
  title: "Market Board",
  description:
    "Deterministic simulated instruments priced in Moroccan dirhams. Quotes update every three seconds.",
  robots: { index: false, follow: false },
};

/**
 * Server shell for the market board.
 *
 * The board is a live instrument panel: it polls quotes every three seconds and
 * its contents depend on the current minute, so it cannot be prerendered. Under
 * Cache Components, `connection()` must sit *inside* a Suspense boundary — that
 * is what turns the page into a partial prerender: the shell is baked at build
 * time and the board streams in on request, instead of the whole route being
 * blocked from prerendering.
 *
 * Quotes are deliberately not fetched here and passed down. They carry `bigint`
 * money fields, which React cannot serialise across the server/client boundary,
 * so the board fetches them itself from the API.
 */
export default async function MarketPage() {
  return (
    <main id="main-content" className="flex-1">
      <SimulatorNav />
      <Suspense fallback={<BoardSkeleton />}>
        <LiveBoard />
      </Suspense>
    </main>
  );
}

/** Marks the subtree as request-time, so the shell above can still prerender. */
async function LiveBoard() {
  await connection();
  return <MarketBoard />;
}

function BoardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 border-b border-rule pb-6">
        <div className="h-8 w-72 rounded bg-surface-inset" />
        <div className="mt-2 h-4 w-96 rounded bg-surface-inset" />
      </div>
      <div className="h-64 rounded-lg border border-rule bg-surface-sunken" />
    </div>
  );
}