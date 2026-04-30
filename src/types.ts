// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum LinkState {
  live = "Live",
  opening = "Opening",
  closing = "Closing",
  idle = "Idle",
  resuming = "Resuming",
}

export enum DeliveryMode {
  atMostOnce = 0,
  atLeastOnce = 1,
  exactlyOnce = 2,
}

// ---------------------------------------------------------------------------
// Core data types
// ---------------------------------------------------------------------------

/** A raw message exactly as received from / sent to the broker. */
export interface Envelope {
  payload: Uint8Array;
  topic: string;
  qos: DeliveryMode;
}

/** Metadata about the active broker connection. */
export interface EndpointInfo {
  clientId: string;
  username: string;
  keepAliveSeconds: number;
  connectTimeout: number;
  host: string;
  port: number;
  scheme: string;
}

// ---------------------------------------------------------------------------
// Endpoint configuration
// ---------------------------------------------------------------------------

/** Credentials and transport parameters for establishing a broker connection. */
export interface EndpointConfig {
  host: string;
  port: number;
  /** `"wss"` (default) or `"ws"`. */
  scheme?: string;
  clientId?: string;
  username?: string;
  password?: string;
  /**
   * When `false` the broker MAY restore a previous session for this clientId.
   * Defaults to `false`.
   */
  cleanSession?: boolean;
  /** Keep-alive interval in seconds. Defaults to `15`. */
  keepAliveSeconds?: number;
  /** WebSocket path appended to the broker URL, e.g. `"/mqtt"`. */
  path?: string;
}

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

export interface RealtimeClientConfig {
  /** Direct connection credentials. */
  endpoint: EndpointConfig;

  /**
   * Called when the broker rejects the connection due to an auth error.
   * The returned config is used to reconnect immediately.
   */
  onAuthFailure?: () => Promise<EndpointConfig>;

  // -- Timing & retry -------------------------------------------------------

  /** Milliseconds between automatic reconnection attempts. Default `50`. */
  reconnectInterval?: number;
  /** Milliseconds to wait for the initial handshake. Default `30 000`. */
  handshakeTimeout?: number;
  /** Milliseconds to wait for a heartbeat response before marking unhealthy. Default `10 000`. */
  heartbeatTimeout?: number;

  /** Exponential back-off parameters for credential-fetch retries. */
  retryBackoff?: {
    /** Initial delay in seconds. Default `1`. */
    baseSeconds?: number;
    /** Maximum delay in seconds. Default `60`. */
    ceilSeconds?: number;
  };

  // -- Topic health ---------------------------------------------------

  /** When enabled, the SDK periodically verifies broker-side subscriptions. */
  topicAudit?: {
    enabled: boolean;
    /** Audit interval in milliseconds. Default `10 000`. */
    intervalMs?: number;
  };
}

// ---------------------------------------------------------------------------
// Diagnostic event system
// ---------------------------------------------------------------------------

export type DiagnosticKind =
  | "link:opening"
  | "link:live"
  | "link:failed"
  | "link:rejected"
  | "link:resuming"
  | "link:closing"
  | "link:dropped"
  | "envelope:in"
  | "envelope:out"
  | "envelope:out:ok"
  | "envelope:out:fail"
  | "topic:sub:try"
  | "topic:sub:ok"
  | "topic:sub:fail"
  | "topic:unsub:try"
  | "topic:unsub:ok"
  | "topic:unsub:fail"
  | "heartbeat:sent"
  | "heartbeat:ok"
  | "heartbeat:timeout";

export interface DiagnosticEvent {
  kind: DiagnosticKind;
  topic?: string;
  qos?: DeliveryMode;
  reason?: string;
  /** Wall-clock timestamp (`Date.now()`) when the event was created. */
  ts: number;
  /** Milliseconds elapsed (e.g. handshake latency, heartbeat RTT). */
  elapsed?: number;
  endpointInfo?: EndpointInfo;
}

// ---------------------------------------------------------------------------
// Retry strategy
// ---------------------------------------------------------------------------

export interface RetryStrategy {
  /** Returns the number of seconds to wait before retrying, or `0` to stop. */
  getDelay(error?: unknown): number;
  /** Resets the backoff counter (call after a successful operation). */
  reset(): void;
}

// ---------------------------------------------------------------------------
// Callback shorthands
// ---------------------------------------------------------------------------

/**
 * Handler invoked for every incoming message.
 *
 * @param topic  The topic the message was published to.
 * @param data   The payload, automatically JSON-parsed if possible.
 * @param raw    The original {@link Envelope} with the binary payload.
 */
export type EnvelopeHandler = (
  topic: string,
  data: unknown,
  raw: Envelope,
) => void;

export type LinkStateHandler = (state: LinkState) => void;
export type DiagnosticHandler = (event: DiagnosticEvent) => void;
