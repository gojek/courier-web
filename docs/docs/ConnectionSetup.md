---
id: ConnectionSetup
title: Connection Setup
sidebar_position: 4
---

# Connection Setup

## Endpoint Configuration

The `endpoint` field in `RealtimeClientConfig` defines the broker connection parameters:

```ts
const client = new RealtimeClient({
  endpoint: {
    host: "broker.example.com",   // Broker hostname
    port: 443,                     // Broker port
    scheme: "wss",                 // "wss" (secure) or "ws"
    path: "/mqtt",                 // WebSocket path (if required by broker)
    clientId: "my-client-123",     // Unique client identifier
    username: "user",              // Auth username
    password: "token",             // Auth password / token
    cleanSession: false,           // Broker session persistence
    keepAliveSeconds: 15,          // Keep-alive interval
  },
});
```

### Field Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `host` | `string` | required | Broker hostname |
| `port` | `number` | required | Broker port |
| `scheme` | `string` | `"wss"` | WebSocket scheme |
| `path` | `string` | — | WebSocket path appended to URL |
| `clientId` | `string` | — | Unique client identifier |
| `username` | `string` | — | Auth username |
| `password` | `string` | — | Auth password or token |
| `cleanSession` | `boolean` | `false` | Whether broker should discard previous session |
| `keepAliveSeconds` | `number` | `15` | MQTT keep-alive interval in seconds |

## Connection Lifecycle

```
Idle → Opening → Live → Closing → Idle
                   ↓
               Resuming → Live (auto-reconnect)
```

The SDK handles reconnection automatically. When the connection drops, it transitions to `Resuming` and attempts to reconnect using mqtt.js's built-in reconnection mechanism. Upon reconnection, all tracked subscriptions are restored.

## Connection State

Monitor the connection state using callbacks or observables:

```ts
// Callback API
client.onStateChange((state) => {
  // LinkState: "Live" | "Opening" | "Closing" | "Idle" | "Resuming"
});

// RxJS API
client.state$.subscribe((state) => {
  console.log(state);
});
```
