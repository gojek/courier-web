// Core
export { RealtimeClient } from "./RealtimeClient";

// Enums & types
export { LinkState, DeliveryMode } from "./types";
export type {
  RealtimeClientConfig,
  EndpointConfig,
  Envelope,
  DiagnosticEvent,
  DiagnosticKind,
  EndpointInfo,
  RetryStrategy,
  EnvelopeHandler,
  LinkStateHandler,
  DiagnosticHandler,
} from "./types";

// Auth
export type { CredentialSource } from "./auth/CredentialSource";
export { InlineCredentials } from "./auth/InlineCredentials";
export { RemoteCredentials } from "./auth/RemoteCredentials";
export { ExponentialBackoff } from "./auth/BackoffStrategy";

// Subscription management
export { SubscriptionLedger } from "./topics/SubscriptionLedger";

// Credential storage
export { BrowserVault } from "./storage/BrowserVault";

// Events
export { diagnostic, Diagnostics } from "./events";
