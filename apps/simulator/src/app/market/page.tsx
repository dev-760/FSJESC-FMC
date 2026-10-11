import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { MarketBoard } from "./market-board";

export const metadata: Metadata = {
  title: "Marché & Carnet L2",
  description:
    "Terminal multi-actifs et carnet d'ordres L2 en dirhams marocains (MAD). 110 instruments sur 8 marchés.",
  robots: { index: false, follow: false },
};

export default async function MarketPage() {
  return (
    <main id="main-content" className="flex-1">
      <Suspense fallback={<BoardSkeleton />}>
        <LiveBoard />
      </Suspense>
    </main>
  );
}

async function LiveBoard() {
  await connection();
  return <MarketBoard />;
}

function BoardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-14 w-96 rounded-xl bg-[var(--sim-bg-card)] border border-[var(--sim-border)]" />
      <div className="h-[640px] rounded-2xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)]" />
    </div>
  );
}