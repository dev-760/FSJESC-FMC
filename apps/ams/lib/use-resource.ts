"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Data loading for a single resource.
 *
 * Every page previously hand-rolled its own `useEffect` + `isLoading` + a
 * `try/catch` that swallowed the error, so a failed request rendered as an empty
 * page with no indication anything had gone wrong. This makes the three states
 * explicit and unmissable at the type level: a caller cannot accidentally treat
 * "failed" as "empty".
 *
 * The loader receives an `AbortSignal` which callers must forward to their
 * request, so a slow response cannot overwrite newer state.
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

  /**
   * The loader is held in a ref rather than listed as a dependency, because a
   * caller passing an inline arrow gets a new identity on every render — making
   * it a dependency would refetch forever.
   *
   * The ref is written inside the effect rather than during render: writing a
   * ref while rendering is not allowed, since a render that is thrown away
   * would still have mutated it.
   */
  const loader = useRef(load);

  useEffect(() => {
    loader.current = load;
    const controller = new AbortController();
    let cancelled = false;

    async function fetchResource() {
      try {
        const data = await loader.current(controller.signal);
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
  // `load` is deliberately excluded: an inline arrow from the caller would
    // change identity every render and refetch forever. `deps` is the caller's
    // own dependency list, which cannot be verified through a spread.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ...deps]);

  const retry = useCallback(() => {
    setResource({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  return { resource, retry };
}