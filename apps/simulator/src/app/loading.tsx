import { SimulatorNav } from "@fsjesc/ui/simulator/simulator-nav";

/**
 * Simulator route-level loading state.
 *
 * Provides a stable layout skeleton with the simulator navigation and terminal
 * content shapes rather than a jarring blank frame or un-themed spinner.
 */
export default function Loading() {
  return (
    <main id="main-content" className="flex-1" aria-busy="true">
      <span role="status" className="sr-only">
        Loading terminal workstation
      </span>
      <SimulatorNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-surface-inset" />
          <div className="h-10 w-2/3 max-w-lg rounded bg-surface-inset" />
          <div className="h-4 w-full max-w-xl rounded bg-surface-inset" />
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="rounded-lg border border-rule bg-surface p-5 space-y-3">
              <div className="h-3 w-20 rounded bg-surface-inset" />
              <div className="h-6 w-1/2 rounded bg-surface-inset" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
