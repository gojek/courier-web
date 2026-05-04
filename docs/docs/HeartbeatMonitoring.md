---
id: HeartbeatMonitoring
title: Heartbeat Monitoring
sidebar_position: 10
---

# Heartbeat Monitoring

## How It Works

The SDK monitors connection health using MQTT's built-in PING/PONG mechanism:

1. The mqtt.js client sends a **PINGREQ** packet at the configured `keepAliveSeconds` interval
2. The SDK starts a timeout timer (configurable via `heartbeatTimeout`, default 10 seconds)
3. If a **PINGRESP** is received before the timer expires → connection is **healthy**
4. If the timer expires without a response → connection is **stale**

## Stale Connection Recovery

When a stale connection is detected, the SDK:

1. Force-disconnects the current session
2. Waits 1 second
3. Reconnects to the broker
4. Restores all tracked subscriptions

## Configuration

```ts
const client = new RealtimeClient({
  endpoint: { ... },
  heartbeatTimeout: 10000,  // ms to wait for PINGRESP (default 10000)
});
```

## Monitoring Heartbeat Health

### Callback API

```ts
client.onHeartbeatChange((alive) => {
  if (alive) {
    console.log("Connection healthy");
  } else {
    console.log("Connection degraded");
  }
});
```

### RxJS API

```ts
client.heartbeat$.subscribe((alive) => {
  updateStatusIndicator(alive);
});
```

### Instant Check

```ts
const healthy = client.isHeartbeatHealthy();
```

## React

```tsx
import { useLinkStatus } from "@armaanjain/courier-web-sdk/react";

function StatusIndicator() {
  const { isLive, heartbeatOk } = useLinkStatus();
  return <span>{isLive && heartbeatOk ? "Online" : "Degraded"}</span>;
}
```
