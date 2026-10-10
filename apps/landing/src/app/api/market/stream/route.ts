/**
 * Real-time market data stream (SSE).
 *
 * GET /api/market/stream
 *
 * Implements a Server-Sent Events (SSE) stream providing real-time deterministic
 * quotes and heartbeats to clients without polling overhead. Handles client abort
 * cleanly and sets proxy-aware headers.
 */

import type { NextRequest } from "next/server";
import { market } from "@fsjesc/domain/market/engine";


export function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const signal = req.signal;

  let timer: NodeJS.Timeout | null = null;
  let heartbeat: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial quotes immediately
      try {
        const quotes = market.getQuotes(new Date());
        const payload = {
          timestamp: new Date().toISOString(),
          quotes: quotes.map((q) => ({
            symbol: q.symbol,
            lastCents: q.lastCents,
            bidCents: q.bidCents,
            askCents: q.askCents,
            changeBps: q.changeBps.toString(),
            changeCents: q.changeCents.toString(),
            volume: q.volume,
            asOf: q.asOf,
          })),
        };
        controller.enqueue(encoder.encode(`event: quotes\ndata: ${JSON.stringify(payload)}\n\n`));
      } catch (err) {
        console.error("Error sending initial quotes:", err);
      }

      // Interval stream: every 3 seconds send updated market quotes
      timer = setInterval(() => {
        if (signal.aborted) {
          if (timer) clearInterval(timer);
          if (heartbeat) clearInterval(heartbeat);
          return;
        }

        try {
          const quotes = market.getQuotes(new Date());
          const payload = {
            timestamp: new Date().toISOString(),
            quotes: quotes.map((q) => ({
              symbol: q.symbol,
              lastCents: q.lastCents,
              bidCents: q.bidCents,
              askCents: q.askCents,
              changeBps: q.changeBps.toString(),
              changeCents: q.changeCents.toString(),
              volume: q.volume,
              asOf: q.asOf,
            })),
          };
          controller.enqueue(encoder.encode(`event: quotes\ndata: ${JSON.stringify(payload)}\n\n`));
        } catch (err) {
          console.error("Error streaming quotes:", err);
        }
      }, 3000);

      // Heartbeat ping every 15s to keep connections alive through proxies
      heartbeat = setInterval(() => {
        if (signal.aborted) {
          if (timer) clearInterval(timer);
          if (heartbeat) clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          // Client disconnected
        }
      }, 15000);

      // Clean up when client disconnects
      signal.addEventListener("abort", () => {
        if (timer) clearInterval(timer);
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
    cancel() {
      if (timer) clearInterval(timer);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
