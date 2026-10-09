"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Data loading for a single resource.
 *
 * Every page previously hand-rolled its own `useEffect` + `isLoading` + a
 * `try/catch` that swallowed the error, so a failed request rendered as an empty
 * page with no indication anything had gone wrong. This makes the three states
 * explicit and unmissable at the type level: a caller cannot accidentally treat
 * "failed" as "empty".
 *
 * The request is aborted when the component unmounts or the dependencies
 * change, so a slow response cannot overwrite newer state.
 */
export type Resource<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

export function useResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[] = [],
): {
  resource: Resource<T>;
  retry: () => void;
} {
  const [resource, setResource] = useState<Resource<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const run = useCallback(load, deps);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function fetchResource() {
      try {
        const data = await run(controller.signal);
        if (!cancelled) setResource({ status: "ready", data });
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;
        setResource({
          status: "error",
          message:
            error instanceof Error ? error.message : "The request could not be completed.",
        });
      }
    }

    void fetchResource();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // `run` is memoised on `deps`, so this is exhaustive.
  }, [run, attempt]);

  const retry = useCallback(() => {
    setResource({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  return { resource, retry };
}