import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

/**
 * Route-level loading state.
 *
 * Part 9.6 forbids a global spinner. This file exists so a slow route shows a
 * stable layout skeleton rather than a blank frame; each region brings its own
 * skeleton where that route knows the shape of its content. For genuinely static
 * routes this never renders at all.
 */
export default function Loading() {
  return (
    <main id="main-content" className="flex-1" aria-busy="true">
      <span role="status" className="sr-only">
        Loading page
      </span>
      <Container className="py-16">
        <div className="animate-pulse space-y-4">
          <div className="bg-surface-inset h-4 w-24 rounded" />
          <div className="bg-surface-inset h-9 w-3/4 max-w-xl rounded" />
          <div className="bg-surface-inset h-4 w-full max-w-2xl rounded" />
          <div className="bg-surface-inset h-4 w-5/6 max-w-2xl rounded" />
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="border-border bg-surface space-y-3 rounded-lg border p-5">
              <div className="bg-surface-inset h-3 w-20 rounded" />
              <div className="bg-surface-inset h-5 w-4/5 rounded" />
              <div className="bg-surface-inset h-3 w-full rounded" />
              <div className="bg-surface-inset h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
        <p className="mt-10 text-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Back to home</Link>
          </Button>
        </p>
      </Container>
    </main>
  );
}
