# @gojek/courier-web-sdk

Robust MQTT Web SDK with automatic reconnection, subscription recovery, heartbeat monitoring, and optional React bindings.

## Installation

```bash
npm install @gojek/courier-web-sdk
```

## Quick Start

```ts
import { RealtimeClient } from "@gojek/courier-web-sdk";

const client = new RealtimeClient({
  endpoint: {
    host: "broker.example.com",
    port: 443,
    scheme: "wss",
    path: "/mqtt",
    clientId: "my-client-123",
    username: "user",
    password: "token",
  },
  topicAudit: { enabled: true, intervalMs: 10_000 },
});

await client.connect();
await client.subscribe("chat/room/42");

client.onEnvelope("chat/room/42", (topic, data) => {
  console.log("Received:", data);
});

await client.publish("chat/room/42", { text: "Hello!" });
```

## React

```tsx
import { RealtimeClient } from "@gojek/courier-web-sdk";
import {
  RealtimeScope,
  useLinkStatus,
  useInbox,
  useTopicBind,
} from "@gojek/courier-web-sdk/react";

const client = new RealtimeClient({ endpoint: { ... } });
await client.connect();

function App() {
  return (
    <RealtimeScope client={client}>
      <ChatRoom channelId="42" />
    </RealtimeScope>
  );
}

function ChatRoom({ channelId }: { channelId: string }) {
  const { isLive, heartbeatOk } = useLinkStatus();
  const { bound } = useTopicBind(`chat/room/${channelId}`);

  useInbox(`chat/room/${channelId}`, (topic, data) => {
    console.log("New message:", data);
  });

  if (!isLive) return <div>Connecting...</div>;
  if (!bound) return <div>Subscribing...</div>;
  return <div>Live! Heartbeat: {heartbeatOk ? "OK" : "Degraded"}</div>;
}
```

## Configuration

```ts
new RealtimeClient({
  // Required
  endpoint: {
    host: "broker.example.com",
    port: 443,
    scheme: "wss",           // "wss" (default) or "ws"
    path: "/mqtt",           // WebSocket path if required
    clientId: "my-client",
    username: "user",
    password: "token",
    cleanSession: false,     // default false
    keepAliveSeconds: 15,    // default 15
  },

  // Optional - auto-recover from expired tokens
  onAuthFailure: async () => {
    const fresh = await myApi.refreshToken();
    return { host: "...", port: 443, ...fresh };
  },

  // Optional - timing
  reconnectInterval: 50,     // ms between reconnect attempts (default 50)
  handshakeTimeout: 30000,   // ms to wait for CONNECT ack (default 30000)
  heartbeatTimeout: 10000,   // ms to wait for PINGRESP (default 10000)

  // Optional - retry backoff for credential fetches
  retryBackoff: {
    baseSeconds: 1,          // initial delay (default 1)
    ceilSeconds: 60,         // max delay (default 60)
  },

  // Optional - periodic subscription audit
  topicAudit: {
    enabled: true,
    intervalMs: 10000,       // default 10000
  },
});
```

## API

### Connection

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `Promise<void>` | Open the broker connection |
| `disconnect()` | `Promise<void>` | Gracefully close |
| `destroy()` | `Promise<void>` | Close and release all resources |
| `isConnected()` | `boolean` | Is the link currently live? |
| `getState()` | `LinkState` | Current state enum |

### Subscribe / Unsubscribe

| Method | Returns | Description |
|--------|---------|-------------|
| `subscribe(topic, qos?)` | `Promise<void>` | Subscribe (auto-restored on reconnect) |
| `unsubscribe(topic)` | `Promise<void>` | Unsubscribe and stop tracking |
| `getSubscribedTopics()` | `string[]` | List all tracked topics |

### Publish

| Method | Returns | Description |
|--------|---------|-------------|
| `publish(topic, payload, qos?)` | `Promise<void>` | Publish (objects auto-serialized to JSON) |

### Callbacks

All callback methods return an unsubscribe function.

| Method | Callback Signature |
|--------|-------------------|
| `onEnvelope(handler)` | `(topic, data, raw) => void` |
| `onEnvelope(topic, handler)` | `(topic, data, raw) => void` |
| `onStateChange(handler)` | `(state: LinkState) => void` |
| `onHeartbeatChange(handler)` | `(alive: boolean) => void` |
| `onDiagnostic(handler)` | `(event: DiagnosticEvent) => void` |
| `onDiagnostic(kind, handler)` | `(event: DiagnosticEvent) => void` |

### RxJS Observables

| Property | Type |
|----------|------|
| `envelopes$` | `Observable<Envelope>` |
| `state$` | `Observable<LinkState>` |
| `heartbeat$` | `Observable<boolean>` |
| `diagnostics$` | `Observable<DiagnosticEvent>` |

## React Hooks

All hooks require a `<RealtimeScope>` ancestor.

| Hook | Returns | Description |
|------|---------|-------------|
| `useLinkStatus()` | `{ linkState, heartbeatOk, isLive }` | Connection and heartbeat status |
| `useTopicBind(topic)` | `{ bound, error }` | Declarative subscribe/unsubscribe |
| `useInbox(topic, handler)` | `void` | Listen for messages on a topic |
| `useRealtimeClient()` | `RealtimeClient` | Direct client access |

## Enums

### LinkState

| Value | Meaning |
|-------|---------|
| `Live` | Connected and operational |
| `Opening` | Handshake in progress |
| `Closing` | Graceful disconnect in progress |
| `Idle` | Not connected |
| `Resuming` | Auto-reconnecting |

### DeliveryMode

| Value | QoS | Meaning |
|-------|-----|---------|
| `atMostOnce` (0) | 0 | Fire and forget |
| `atLeastOnce` (1) | 1 | Acknowledged delivery |
| `exactlyOnce` (2) | 2 | Exactly once delivery |

## Utilities

### BrowserVault

Persist credentials across page reloads via cookies.

```ts
import { BrowserVault } from "@gojek/courier-web-sdk";

const vault = new BrowserVault("myapp_", 30);
vault.store({ host: "...", port: 443, clientId: "...", username: "...", password: "..." });
const saved = vault.retrieve();
vault.purge();
```

### RemoteCredentials

Fetch tokens from an HTTP endpoint.

```ts
import { RemoteCredentials } from "@gojek/courier-web-sdk";

const creds = new RemoteCredentials("https://api.example.com/mqtt/token", (res) => ({
  host: res.broker.host,
  port: res.broker.port,
  username: res.userId,
  password: res.jwt,
  scheme: "wss",
  path: "/mqtt",
}));
```

## Automatic Behaviors

| Scenario | SDK Behavior |
|----------|-------------|
| Network drops | Auto-reconnects, restores all subscriptions |
| Token expires | Calls `onAuthFailure`, reconnects with fresh credentials |
| Heartbeat timeout | Force-reconnects, restores subscriptions |
| Subscribe fails | Queued in backlog, retried on next successful connection |
| Subscription drift | Periodic audit detects and repairs missing subscriptions |
