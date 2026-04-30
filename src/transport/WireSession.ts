import * as mqttLib from "mqtt";
import type { MqttClient } from "mqtt";
import { Subject, filter, type Observable } from "rxjs";

import {
  LinkState,
  type EndpointConfig,
  type Envelope,
  type DiagnosticEvent,
  type RetryStrategy,
  type DeliveryMode,
} from "../types";
import type { CredentialSource } from "../auth/CredentialSource";
import { InlineCredentials } from "../auth/InlineCredentials";
import { Diagnostics } from "../events";
import { HeartbeatGuard } from "./HeartbeatGuard";

// Handle both ESM and CJS mqtt exports
const wire = (mqttLib as any).default || mqttLib;

// ---------------------------------------------------------------------------
// Internal config passed down from RealtimeClient
// ---------------------------------------------------------------------------
export interface SessionConfig {
  retryStrategy: RetryStrategy;
  reconnectInterval?: number;
  handshakeTimeout?: number;
  heartbeatTimeout?: number;
  onAuthFailure?: () => Promise<EndpointConfig>;
}

/**
 * Low-level broker session.
 *
 * Owns the mqtt.js client, connection lifecycle, event handlers,
 * subscription tracking, and reconnection logic.  Not intended for
 * direct use — {@link RealtimeClient} composes this internally.
 */
export class WireSession {
  private client: MqttClient | null = null;
  private credSource: CredentialSource;
  private cfg: SessionConfig;
  private activeCfg: EndpointConfig | null = null;

  // RxJS subjects
  private readonly envelopeSubject = new Subject<Envelope>();
  private readonly diagSubject = new Subject<DiagnosticEvent>();
  private readonly stateSubject = new Subject<LinkState>();

  private link: LinkState = LinkState.idle;
  private recovering = false;
  private openedOnce = false;

  /** topic → qos */
  readonly trackedTopics: Map<string, number> = new Map();

  readonly heartbeat: HeartbeatGuard;

  constructor(credSource: CredentialSource, cfg: SessionConfig) {
    this.credSource = credSource;
    this.cfg = cfg;
    this.heartbeat = new HeartbeatGuard(cfg.heartbeatTimeout);
    this.heartbeat.onStaleDetected = () => this.recoverFromStale();
  }

  // ── Observables ──────────────────────────────────────────────────────────

  get envelopes$(): Observable<Envelope> {
    return this.envelopeSubject.asObservable();
  }

  envelopesFor$(topic: string): Observable<Envelope> {
    return this.envelopeSubject
      .asObservable()
      .pipe(filter((e) => e.topic === topic));
  }

  get state$(): Observable<LinkState> {
    return this.stateSubject.asObservable();
  }

  get diagnostics$(): Observable<DiagnosticEvent> {
    return this.diagSubject.asObservable();
  }

  get currentState(): LinkState {
    return this.link;
  }

  get isLive(): boolean {
    return this.link === LinkState.live;
  }

  listTracked(): string[] {
    return Array.from(this.trackedTopics.keys());
  }

  // ── Connection ───────────────────────────────────────────────────────────

  async open(): Promise<void> {
    if (this.link !== LinkState.idle) {
      this.emit(Diagnostics.linkRejected("Session already active"));
      return;
    }

    try {
      this.setLink(LinkState.opening);
      const ep = await this.resolveCredentials();
      this.activeCfg = ep;
      this.cfg.retryStrategy.reset();

      this.emit(Diagnostics.linkOpening());

      // Build broker URL
      const scheme = ep.scheme || "wss";
      const port = ep.port || (scheme === "wss" ? 443 : 1883);
      let brokerUrl = `${scheme}://${ep.host}:${port}`;
      if (ep.path) brokerUrl += ep.path;

      const opts: mqttLib.IClientOptions = {
        clientId: ep.clientId,
        username: ep.username,
        password: ep.password,
        keepalive: ep.keepAliveSeconds ?? 15,
        clean: ep.cleanSession !== false,
        reconnectPeriod: this.cfg.reconnectInterval ?? 50,
        connectTimeout: this.cfg.handshakeTimeout ?? 30_000,
        rejectUnauthorized: false,
        protocolVersion: 4,
        wsOptions: {
          rejectUnauthorized: false,
          headers: {
            Origin:
              typeof window !== "undefined" ? window.location.origin : "",
          },
        },
      };

      const connectFn: typeof mqttLib.connect =
        (wire as any).connect ||
        (wire as any).default?.connect ||
        wire;

      if (typeof connectFn !== "function") {
        throw new Error("mqtt connect function not found");
      }

      this.client = connectFn(brokerUrl, opts);
      this.attachHandlers();
      this.setLink(this.inferLink());
    } catch (error) {
      this.setLink(LinkState.idle);
      if (this.client) {
        try { this.client.end(true); } catch { /* */ }
        this.client = null;
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    this.emit(Diagnostics.linkClosing());
    this.setLink(LinkState.closing);
    this.heartbeat.markDown();
    this.openedOnce = false;

    if (this.client) {
      return new Promise<void>((resolve) => {
        this.client!.end(false, {}, () => {
          this.client = null;
          this.activeCfg = null;
          this.setLink(LinkState.idle);
          resolve();
        });
      });
    }
  }

  async teardown(): Promise<void> {
    await this.close();
    this.envelopeSubject.complete();
    this.diagSubject.complete();
    this.stateSubject.complete();
    this.heartbeat.teardown();
    this.trackedTopics.clear();
  }

  // ── Subscribe / Unsubscribe ──────────────────────────────────────────────

  async addTopic(topic: string, qos: number = 0): Promise<void> {
    if (!this.client) throw new Error("Session not open");

    this.emit(Diagnostics.topicSubTry(topic, qos as DeliveryMode));
    const t0 = Date.now();

    return new Promise((resolve, reject) => {
      this.client!.subscribe(topic, { qos: qos as 0 | 1 | 2 }, (err, granted) => {
        if (err) {
          this.emit(Diagnostics.topicSubFail(topic, String(err), qos as DeliveryMode));
          return reject(err);
        }
        if (granted && granted.length > 0 && (granted[0] as any).qos !== 128) {
          this.trackedTopics.set(topic, qos);
          this.emit(Diagnostics.topicSubOk(topic, qos as DeliveryMode, Date.now() - t0));
          resolve();
        } else {
          const e = new Error("Subscription rejected by broker (0x80)");
          this.emit(Diagnostics.topicSubFail(topic, e.message, qos as DeliveryMode));
          reject(e);
        }
      });
    });
  }

  async dropTopic(topic: string): Promise<void> {
    if (!this.client) throw new Error("Session not open");

    this.emit(Diagnostics.topicUnsubTry(topic));
    const t0 = Date.now();

    return new Promise((resolve, reject) => {
      this.client!.unsubscribe(topic, (err) => {
        if (err) {
          this.emit(Diagnostics.topicUnsubFail(topic, String(err)));
          return reject(err);
        }
        this.trackedTopics.delete(topic);
        this.emit(Diagnostics.topicUnsubOk(topic, Date.now() - t0));
        resolve();
      });
    });
  }

  // ── Publish ──────────────────────────────────────────────────────────────

  async send(envelope: Envelope): Promise<void> {
    if (!this.client) throw new Error("Session not open");

    this.emit(Diagnostics.envelopeOut(envelope.topic, envelope.qos));
    const t0 = Date.now();

    return new Promise((resolve, reject) => {
      this.client!.publish(
        envelope.topic,
        envelope.payload as Buffer,
        { qos: envelope.qos },
        (err) => {
          if (err) {
            this.emit(Diagnostics.envelopeOutFail(envelope.topic, String(err), envelope.qos));
            return reject(err);
          }
          this.emit(Diagnostics.envelopeOutOk(envelope.topic, envelope.qos, Date.now() - t0));
          resolve();
        },
      );
    });
  }

  /** Swap the credential source (e.g. after external token refresh). */
  swapCredentials(src: CredentialSource): void {
    this.credSource = src;
  }

  // ── Private: event wiring ────────────────────────────────────────────────

  private attachHandlers(): void {
    if (!this.client) return;

    this.client.on("connect", () => {
      this.emit(Diagnostics.linkLive());
      this.setLink(this.inferLink());
      this.heartbeat.markUp();

      if (this.openedOnce) {
        this.restoreAllTopics();
      }
      this.openedOnce = true;
    });

    this.client.on("disconnect", () => {
      this.setLink(this.inferLink());
      this.heartbeat.markDown();
    });

    this.client.on("reconnect", () => {
      this.emit(Diagnostics.linkResuming());
      this.setLink(this.inferLink());
    });

    this.client.on("message", (topic, payload, packet) => {
      this.emit(Diagnostics.envelopeIn(topic, packet.qos as DeliveryMode));
      this.envelopeSubject.next({
        topic,
        payload: new Uint8Array(payload),
        qos: packet.qos as DeliveryMode,
      });
    });

    this.client.on("error", (error) => {
      this.emit(Diagnostics.linkFailed(String(error)));

      const msg = ((error as any)?.message || "").toLowerCase();
      const code = (error as any)?.code;
      const isCredentialIssue =
        code === 5 ||
        msg.includes("not authorized") ||
        msg.includes("unauthorized") ||
        msg.includes("authentication") ||
        msg.includes("connection refused");

      if (isCredentialIssue) this.recoverFromAuth();
    });

    this.client.on("offline", () => {
      this.emit(Diagnostics.linkDropped());
    });

    this.client.on("packetsend", (packet: any) => {
      if (packet.cmd === "pingreq") {
        this.emit(Diagnostics.heartbeatSent());
        this.heartbeat.beat();
      }
    });

    this.client.on("packetreceive", (packet: any) => {
      if (packet.cmd === "pingresp") {
        const latency = this.heartbeat.ack();
        this.emit(Diagnostics.heartbeatOk(latency));
      }
    });
  }

  // ── Private: topic restoration ───────────────────────────────────────────

  private async restoreAllTopics(): Promise<void> {
    if (this.trackedTopics.size === 0) return;

    const tasks: Promise<void>[] = [];
    for (const [topic, qos] of this.trackedTopics) {
      tasks.push(this.silentSubscribe(topic, qos));
    }
    await Promise.allSettled(tasks);
  }

  private async silentSubscribe(topic: string, qos: number): Promise<void> {
    if (!this.client) throw new Error("Session not open");

    return new Promise((resolve, reject) => {
      this.client!.subscribe(topic, { qos: qos as 0 | 1 | 2 }, (err, granted) => {
        if (err) return reject(err);
        if (granted && granted.length > 0 && (granted[0] as any).qos !== 128) {
          resolve();
        } else {
          reject(new Error("Re-subscription rejected"));
        }
      });
    });
  }

  // ── Private: recovery ────────────────────────────────────────────────────

  private async recoverFromStale(): Promise<void> {
    if (this.recovering) return;
    try {
      this.forceShutdown();
      await this.pause(1000);
      await this.open();
      await this.restoreAllTopics();
    } catch {
      // underlying auto-reconnect will continue trying
    }
  }

  private async recoverFromAuth(): Promise<void> {
    if (this.recovering) return;
    this.recovering = true;

    try {
      this.forceShutdown();

      if (this.cfg.onAuthFailure) {
        const fresh = await this.cfg.onAuthFailure();
        if (fresh) {
          this.credSource = new InlineCredentials(fresh);
        }
      }

      await this.pause(2000);
      await this.open();
      await this.restoreAllTopics();
    } catch {
      // caller / app must handle re-authentication
    } finally {
      this.recovering = false;
    }
  }

  private forceShutdown(): void {
    if (this.client) {
      try { this.client.end(true); } catch { /* */ }
      this.client = null;
    }
    this.setLink(LinkState.idle);
    this.activeCfg = null;
  }

  // ── Private: helpers ─────────────────────────────────────────────────────

  private async resolveCredentials(): Promise<EndpointConfig> {
    try {
      return await this.credSource.resolve();
    } catch (error) {
      const wait = this.cfg.retryStrategy.getDelay(error);
      if (wait > 0) {
        await this.pause(wait * 1000);
        return this.resolveCredentials();
      }
      throw error;
    }
  }

  private setLink(state: LinkState): void {
    if (this.link !== state) {
      this.link = state;
      this.stateSubject.next(state);
    }
  }

  private emit(event: DiagnosticEvent): void {
    this.diagSubject.next(event);
  }

  private inferLink(): LinkState {
    if (!this.client) return LinkState.idle;
    if (this.client.connected) return LinkState.live;
    if (this.client.reconnecting) return LinkState.resuming;
    if (this.client.disconnecting) return LinkState.closing;
    if ((this.client as any).disconnected) return LinkState.idle;
    return LinkState.opening;
  }

  private pause(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
