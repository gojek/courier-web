import type { Observable, Subscription } from "rxjs";

import {
  LinkState,
  DeliveryMode,
  type RealtimeClientConfig,
  type EndpointConfig,
  type Envelope,
  type DiagnosticEvent,
  type DiagnosticKind,
  type EnvelopeHandler,
  type LinkStateHandler,
  type DiagnosticHandler,
} from "./types";
import { InlineCredentials } from "./auth/InlineCredentials";
import { ExponentialBackoff } from "./auth/BackoffStrategy";
import { WireSession, type SessionConfig } from "./transport/WireSession";
import { SubscriptionLedger } from "./topics/SubscriptionLedger";

const dec = new TextDecoder();
const enc = new TextEncoder();

/**
 * High-level real-time messaging client for web applications.
 *
 * Composes a wire session (connection management, reconnection, auth
 * recovery, heartbeat monitoring) with a subscription ledger (topic
 * tracking, retry, periodic audit) behind a single, easy-to-use API.
 *
 * @example
 * ```ts
 * import { RealtimeClient } from "@armaanjain/courier-web-sdk";
 *
 * const rt = new RealtimeClient({
 *   endpoint: { host: "broker.example.com", port: 443, scheme: "wss",
 *               path: "/mqtt", clientId: "abc", username: "u", password: "p" },
 *   topicAudit: { enabled: true, intervalMs: 10_000 },
 * });
 *
 * await rt.connect();
 * await rt.subscribe("room/42");
 *
 * rt.onEnvelope("room/42", (topic, data) => console.log(data));
 * ```
 */
export class RealtimeClient {
  private readonly wire: WireSession;
  private readonly ledger: SubscriptionLedger;

  constructor(config: RealtimeClientConfig) {
    const creds = new InlineCredentials(config.endpoint);

    const backoff = config.retryBackoff ?? {};
    const strategy = new ExponentialBackoff(
      backoff.baseSeconds ?? 1,
      backoff.ceilSeconds ?? 60,
    );

    const sessionCfg: SessionConfig = {
      retryStrategy: strategy,
      reconnectInterval: config.reconnectInterval,
      handshakeTimeout: config.handshakeTimeout,
      heartbeatTimeout: config.heartbeatTimeout,
      onAuthFailure: config.onAuthFailure,
    };

    this.wire = new WireSession(creds, sessionCfg);

    const audit = config.topicAudit;
    this.ledger = new SubscriptionLedger(
      this.wire,
      audit?.enabled ? (audit.intervalMs ?? 10_000) : undefined,
    );
  }

  // ── Connection ───────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    await this.wire.open();
  }

  async disconnect(): Promise<void> {
    this.ledger.stopAudit();
    await this.wire.close();
  }

  async destroy(): Promise<void> {
    this.ledger.teardown();
    await this.wire.teardown();
  }

  isConnected(): boolean {
    return this.wire.isLive;
  }

  getState(): LinkState {
    return this.wire.currentState;
  }

  // ── Subscribe / Unsubscribe ──────────────────────────────────────────────

  /**
   * Subscribe to `topic`.  The subscription is tracked and will be
   * automatically restored after any reconnection.
   */
  async subscribe(
    topic: string,
    qos: DeliveryMode = DeliveryMode.atMostOnce,
  ): Promise<void> {
    await this.ledger.add(topic, qos);
  }

  async unsubscribe(topic: string): Promise<void> {
    await this.ledger.remove(topic);
  }

  getSubscribedTopics(): string[] {
    return this.ledger.listDesired();
  }

  // ── Publish ──────────────────────────────────────────────────────────────

  /**
   * Publish a message.  If `payload` is not a `Uint8Array`, it is
   * automatically JSON-serialised and UTF-8 encoded.
   */
  async publish(
    topic: string,
    payload: unknown,
    qos: DeliveryMode = DeliveryMode.atMostOnce,
  ): Promise<void> {
    const binary: Uint8Array =
      payload instanceof Uint8Array
        ? payload
        : enc.encode(JSON.stringify(payload));

    await this.wire.send({ topic, payload: binary, qos });
  }

  // ── Envelope callbacks ───────────────────────────────────────────────────

  /**
   * Listen for incoming envelopes on all topics or a specific topic.
   * Returns an unsubscribe function.
   */
  onEnvelope(handler: EnvelopeHandler): () => void;
  onEnvelope(topic: string, handler: EnvelopeHandler): () => void;
  onEnvelope(
    topicOrHandler: string | EnvelopeHandler,
    maybeHandler?: EnvelopeHandler,
  ): () => void {
    const filtered = typeof topicOrHandler === "string";
    const handler = filtered ? maybeHandler! : topicOrHandler;
    const src$ = filtered
      ? this.wire.envelopesFor$(topicOrHandler)
      : this.wire.envelopes$;

    const sub: Subscription = src$.subscribe((env) => {
      handler(env.topic, decodePayload(env.payload), env);
    });
    return () => sub.unsubscribe();
  }

  // ── Link status callbacks ────────────────────────────────────────────────

  onStateChange(handler: LinkStateHandler): () => void {
    const sub = this.wire.state$.subscribe(handler);
    return () => sub.unsubscribe();
  }

  onHeartbeatChange(handler: (alive: boolean) => void): () => void {
    const sub = this.wire.heartbeat.liveness$.subscribe(handler);
    return () => sub.unsubscribe();
  }

  // ── Diagnostics callbacks ────────────────────────────────────────────────

  onDiagnostic(handler: DiagnosticHandler): () => void;
  onDiagnostic(kind: DiagnosticKind, handler: DiagnosticHandler): () => void;
  onDiagnostic(
    kindOrHandler: DiagnosticKind | DiagnosticHandler,
    maybeHandler?: DiagnosticHandler,
  ): () => void {
    if (typeof kindOrHandler === "function") {
      const sub = this.wire.diagnostics$.subscribe(kindOrHandler);
      return () => sub.unsubscribe();
    }
    const sub = this.wire.diagnostics$.subscribe((ev) => {
      if (ev.kind === kindOrHandler) maybeHandler!(ev);
    });
    return () => sub.unsubscribe();
  }

  // ── RxJS Observables (power-user API) ────────────────────────────────────

  get envelopes$(): Observable<Envelope> {
    return this.wire.envelopes$;
  }

  get state$(): Observable<LinkState> {
    return this.wire.state$;
  }

  get heartbeat$(): Observable<boolean> {
    return this.wire.heartbeat.liveness$;
  }

  get diagnostics$(): Observable<DiagnosticEvent> {
    return this.wire.diagnostics$;
  }

  // ── Ledger access ────────────────────────────────────────────────────────

  /** Direct access to the underlying {@link SubscriptionLedger} for advanced use. */
  get subscriptions(): SubscriptionLedger {
    return this.ledger;
  }

  // ── Heartbeat ────────────────────────────────────────────────────────────

  isHeartbeatHealthy(): boolean {
    return this.wire.heartbeat.isAlive;
  }

  // ── Credentials ──────────────────────────────────────────────────────────

  /**
   * Provide fresh credentials (e.g. after an external token refresh).
   * Will be used for the next (re-)connection.
   */
  updateEndpoint(cfg: EndpointConfig): void {
    this.wire.swapCredentials(new InlineCredentials(cfg));
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decodePayload(payload: Uint8Array): unknown {
  try {
    const text = dec.decode(payload);
    return JSON.parse(text);
  } catch {
    try {
      const text = dec.decode(payload);
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {
      // fall through
    }
    return dec.decode(payload);
  }
}
