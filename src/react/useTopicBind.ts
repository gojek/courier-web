import { useState, useEffect } from "react";
import type { DeliveryMode } from "../types";
import { useRealtimeClient } from "./RealtimeScope";

export interface UseTopicBindResult {
  /** `true` once the broker has acknowledged the subscription. */
  bound: boolean;
  /** Non-null if the subscribe attempt failed. */
  error: Error | null;
}

/**
 * Declaratively bind to a topic.
 *
 * Subscribes on mount (or when `topic` changes) and unsubscribes on
 * unmount.  The subscription is tracked by the {@link SubscriptionLedger}
 * and will be restored after reconnections automatically.
 *
 * Pass `null` to skip binding.
 *
 * @example
 * ```tsx
 * function Feed({ channelId }: { channelId: string }) {
 *   const { bound, error } = useTopicBind(`feed/${channelId}`);
 *   if (error) return <div>Bind failed</div>;
 *   if (!bound) return <div>Connecting...</div>;
 *   return <div>Live!</div>;
 * }
 * ```
 */
export function useTopicBind(
  topic: string | null,
  options?: { qos?: DeliveryMode },
): UseTopicBindResult {
  const client = useRealtimeClient();
  const [bound, setBound] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!topic) {
      setBound(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setBound(false);
    setError(null);

    client
      .subscribe(topic, options?.qos)
      .then(() => {
        if (!cancelled) setBound(true);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
      client.unsubscribe(topic).catch(() => {});
      setBound(false);
    };
  }, [client, topic, options?.qos]);

  return { bound, error };
}
