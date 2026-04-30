import { useEffect, useRef } from "react";
import type { EnvelopeHandler } from "../types";
import { useRealtimeClient } from "./RealtimeScope";

/**
 * Subscribe to incoming envelopes.
 *
 * When `topic` is provided, only envelopes on that exact topic are
 * delivered.  When omitted, all envelopes are delivered.
 *
 * @example
 * ```tsx
 * useInbox("room/42", (topic, data) => {
 *   console.log("New:", data);
 * });
 * ```
 */
export function useInbox(handler: EnvelopeHandler): void;
export function useInbox(topic: string, handler: EnvelopeHandler): void;
export function useInbox(
  topicOrHandler: string | EnvelopeHandler,
  maybeHandler?: EnvelopeHandler,
): void {
  const client = useRealtimeClient();
  const handlerRef = useRef<EnvelopeHandler>(
    typeof topicOrHandler === "function" ? topicOrHandler : maybeHandler!,
  );
  const topicRef = useRef<string | undefined>(
    typeof topicOrHandler === "string" ? topicOrHandler : undefined,
  );

  // Keep refs current without triggering re-subscribe
  handlerRef.current =
    typeof topicOrHandler === "function" ? topicOrHandler : maybeHandler!;
  topicRef.current =
    typeof topicOrHandler === "string" ? topicOrHandler : undefined;

  useEffect(() => {
    const cb: EnvelopeHandler = (t, d, r) => handlerRef.current(t, d, r);
    const topic = topicRef.current;
    const off = topic
      ? client.onEnvelope(topic, cb)
      : client.onEnvelope(cb);
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, typeof topicOrHandler === "string" ? topicOrHandler : undefined]);
}
