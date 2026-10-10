"use client";

import { useEffect, useRef, useState } from "react";
import { market } from "@fsjesc/domain/market/engine";
import type { Quote } from "@fsjesc/domain/market/provider";

export type StreamStatus = "connecting" | "connected" | "reconnecting" | "offline";

export interface StreamQuote {
  symbol: string;
  lastCents: bigint;
  changeBps: bigint;
}

export function useMarketStream(streamUrl = "/api/market/stream") {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return market.getQuotes(new Date());
    } catch {
      return [];
    }
  });

  const [status, setStatus] = useState<StreamStatus>("connecting");
  const retryCount = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      // Fallback for SSR or non-SSE environments
      const timer = setInterval(() => {
        setQuotes(market.getQuotes(new Date()));
      }, 3000);
      return () => clearInterval(timer);
    }

    let es: EventSource | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    function startFallback() {
      setStatus("offline");
      if (!fallbackTimer) {
        fallbackTimer = setInterval(() => {
          setQuotes(market.getQuotes(new Date()));
        }, 3000);
      }
    }

    function connect() {
      try {
        es = new EventSource(streamUrl);

        es.onopen = () => {
          setStatus("connected");
          retryCount.current = 0;
          if (fallbackTimer) {
            clearInterval(fallbackTimer);
            fallbackTimer = null;
          }
        };

        es.addEventListener("quotes", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data?.quotes && Array.isArray(data.quotes)) {
              const parsed: Quote[] = data.quotes.map(
                (q: {
                  symbol: string;
                  lastCents: number;
                  bidCents: number;
                  askCents: number;
                  changeBps: string | number;
                  changeCents?: string | number;
                  volume?: number;
                  asOf?: number;
                }) => ({
                  symbol: q.symbol,
                  lastCents: Number(q.lastCents),
                  bidCents: Number(q.bidCents),
                  askCents: Number(q.askCents),
                  changeBps: BigInt(q.changeBps),
                  changeCents: BigInt(q.changeCents ?? 0),
                  volume: Number(q.volume ?? 0),
                  asOf: Number(q.asOf ?? Math.floor(Date.now() / 1000)),
                }),
              );
              setQuotes(parsed);
            }
          } catch {
            // Error parsing SSE message
          }
        });

        es.onerror = () => {
          es?.close();
          es = null;

          if (retryCount.current < maxRetries) {
            setStatus("reconnecting");
            retryCount.current += 1;
            // Exponential backoff with jitter (1s, 2s, 4s, etc.)
            const delay = Math.min(1000 * Math.pow(2, retryCount.current) + Math.random() * 500, 15000);
            reconnectTimer = setTimeout(connect, delay);
          } else {
            // Failover to local deterministic engine
            startFallback();
          }
        };
      } catch {
        startFallback();
      }
    }

    connect();

    return () => {
      if (es) es.close();
      if (fallbackTimer) clearInterval(fallbackTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [streamUrl]);

  return { quotes, status };
}
