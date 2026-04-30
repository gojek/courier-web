import { useState, useEffect } from "react";
import { LinkState } from "../types";
import { useRealtimeClient } from "./RealtimeScope";

export interface UseLinkStatusResult {
  /** Current connection state. */
  linkState: LinkState;
  /** Whether the last heartbeat round-trip succeeded. */
  heartbeatOk: boolean;
  /** Shorthand for `linkState === LinkState.live`. */
  isLive: boolean;
}

/**
 * Reactive hook that tracks the connection status and heartbeat health.
 *
 * @example
 * ```tsx
 * function StatusBadge() {
 *   const { isLive, heartbeatOk } = useLinkStatus();
 *   return <span>{isLive && heartbeatOk ? "Online" : "Offline"}</span>;
 * }
 * ```
 */
export function useLinkStatus(): UseLinkStatusResult {
  const client = useRealtimeClient();
  const [linkState, setLinkState] = useState(client.getState());
  const [heartbeatOk, setHeartbeatOk] = useState(client.isHeartbeatHealthy());

  useEffect(() => {
    const off1 = client.onStateChange(setLinkState);
    const off2 = client.onHeartbeatChange(setHeartbeatOk);
    return () => { off1(); off2(); };
  }, [client]);

  return {
    linkState,
    heartbeatOk,
    isLive: linkState === LinkState.live,
  };
}
