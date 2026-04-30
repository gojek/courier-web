import type { DiagnosticEvent, DiagnosticKind, DeliveryMode, EndpointInfo } from "../types";

/**
 * Create a {@link DiagnosticEvent} with sensible defaults.
 */
export function diagnostic(
  kind: DiagnosticKind,
  data?: Partial<Omit<DiagnosticEvent, "kind" | "ts">>,
): DiagnosticEvent {
  return { kind, ts: Date.now(), ...data };
}

/** Convenience builders that improve readability at call-sites. */
export const Diagnostics = {
  linkOpening: (info?: EndpointInfo) =>
    diagnostic("link:opening", { endpointInfo: info }),

  linkLive: (elapsed?: number, info?: EndpointInfo) =>
    diagnostic("link:live", { elapsed, endpointInfo: info }),

  linkFailed: (reason: string, elapsed?: number, info?: EndpointInfo) =>
    diagnostic("link:failed", { reason, elapsed, endpointInfo: info }),

  linkRejected: (reason: string, info?: EndpointInfo) =>
    diagnostic("link:rejected", { reason, endpointInfo: info }),

  linkResuming: (info?: EndpointInfo) =>
    diagnostic("link:resuming", { endpointInfo: info }),

  linkClosing: (info?: EndpointInfo) =>
    diagnostic("link:closing", { endpointInfo: info }),

  linkDropped: (reason?: string, info?: EndpointInfo) =>
    diagnostic("link:dropped", { reason, endpointInfo: info }),

  envelopeIn: (topic: string, qos: DeliveryMode, info?: EndpointInfo) =>
    diagnostic("envelope:in", { topic, qos, endpointInfo: info }),

  envelopeOut: (topic: string, qos: DeliveryMode, info?: EndpointInfo) =>
    diagnostic("envelope:out", { topic, qos, endpointInfo: info }),

  envelopeOutOk: (topic: string, qos: DeliveryMode, elapsed?: number, info?: EndpointInfo) =>
    diagnostic("envelope:out:ok", { topic, qos, elapsed, endpointInfo: info }),

  envelopeOutFail: (topic: string, reason: string, qos: DeliveryMode, info?: EndpointInfo) =>
    diagnostic("envelope:out:fail", { topic, reason, qos, endpointInfo: info }),

  topicSubTry: (topic: string, qos: DeliveryMode, info?: EndpointInfo) =>
    diagnostic("topic:sub:try", { topic, qos, endpointInfo: info }),

  topicSubOk: (topic: string, qos: DeliveryMode, elapsed?: number, info?: EndpointInfo) =>
    diagnostic("topic:sub:ok", { topic, qos, elapsed, endpointInfo: info }),

  topicSubFail: (topic: string, reason: string, qos: DeliveryMode, info?: EndpointInfo) =>
    diagnostic("topic:sub:fail", { topic, reason, qos, endpointInfo: info }),

  topicUnsubTry: (topic: string, info?: EndpointInfo) =>
    diagnostic("topic:unsub:try", { topic, endpointInfo: info }),

  topicUnsubOk: (topic: string, elapsed?: number, info?: EndpointInfo) =>
    diagnostic("topic:unsub:ok", { topic, elapsed, endpointInfo: info }),

  topicUnsubFail: (topic: string, reason: string, info?: EndpointInfo) =>
    diagnostic("topic:unsub:fail", { topic, reason, endpointInfo: info }),

  heartbeatSent: (info?: EndpointInfo) =>
    diagnostic("heartbeat:sent", { endpointInfo: info }),

  heartbeatOk: (elapsed?: number, info?: EndpointInfo) =>
    diagnostic("heartbeat:ok", { elapsed, endpointInfo: info }),

  heartbeatTimeout: (reason?: string, elapsed?: number, info?: EndpointInfo) =>
    diagnostic("heartbeat:timeout", { reason, elapsed, endpointInfo: info }),
} as const;
