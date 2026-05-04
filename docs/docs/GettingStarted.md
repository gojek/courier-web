---
id: GettingStarted
title: Getting Started
sidebar_position: 3
---

# Getting Started

This guide walks you through a minimal setup to connect, subscribe, publish, and receive messages.

## 1. Create a Client

```ts
import { RealtimeClient } from "@armaanjain/courier-web-sdk";

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
});
```

## 2. Connect

```ts
await client.connect();
console.log("Connected:", client.isConnected());
```

## 3. Subscribe to a Topic

```ts
await client.subscribe("chat/room/42");
```

Subscriptions are tracked by the SDK and will be **automatically restored** after any reconnection.

## 4. Listen for Messages

```ts
const unsubscribe = client.onEnvelope("chat/room/42", (topic, data) => {
  console.log("Received on", topic, ":", data);
});

// Later, to stop listening:
unsubscribe();
```

## 5. Publish a Message

```ts
await client.publish("chat/room/42", { text: "Hello world!" });
```

Objects are automatically JSON-serialized. You can also pass a `Uint8Array` for binary payloads.

## 6. Disconnect

```ts
await client.disconnect();
```

Or to fully release all resources:

```ts
await client.destroy();
```

## Monitoring Connection Status

```ts
const off = client.onStateChange((state) => {
  console.log("Connection state:", state);
  // "Live" | "Opening" | "Closing" | "Idle" | "Resuming"
});

const off2 = client.onHeartbeatChange((alive) => {
  console.log("Heartbeat:", alive ? "healthy" : "unhealthy");
});
```

## Next Steps

- [Configuration](./Configuration) — all configuration options
- [Authentication](./Authentication) — token refresh and auth providers
- [React Hooks](./ReactHooks) — using the SDK with React
