---
id: Diagnostics
title: Diagnostics & Events
sidebar_position: 12
---

# Diagnostics & Events

## Overview

The SDK emits diagnostic events for every significant action — connections, subscriptions, messages, and heartbeats. Use these for logging, monitoring, or debugging.

## Listening to Events

### All Events

```ts
client.onDiagnostic((event) => {
  console.log(`[${event.kind}]`, event);
});
```

### Filtered by Kind

```ts
client.onDiagnostic("link:live", (event) => {
  console.log("Connected!", event.ts);
});

client.onDiagnostic("topic:sub:fail", (event) => {
  console.error("Subscribe failed:", event.topic, event.reason);
});
```

### RxJS API

```ts
import { filter } from "rxjs";

client.diagnostics$
  .pipe(filter((e) => e.kind.startsWith("heartbeat:")))
  .subscribe((event) => {
    console.log("Heartbeat event:", event);
  });
```

## Event Kinds

### Connection Events

| Kind | Description |
|------|-------------|
| `link:opening` | Connection attempt initiated |
| `link:live` | Successfully connected |
| `link:failed` | Connection attempt failed |
| `link:rejected` | Connection ignored (already active) |
| `link:resuming` | Auto-reconnection in progress |
| `link:closing` | Graceful disconnect initiated |
| `link:dropped` | Connection lost unexpectedly |

### Message Events

| Kind | Description |
|------|-------------|
| `envelope:in` | Message received from broker |
| `envelope:out` | Message send initiated |
| `envelope:out:ok` | Message sent successfully |
| `envelope:out:fail` | Message send failed |

### Subscription Events

| Kind | Description |
|------|-------------|
| `topic:sub:try` | Subscribe attempt |
| `topic:sub:ok` | Subscribe acknowledged by broker |
| `topic:sub:fail` | Subscribe rejected or failed |
| `topic:unsub:try` | Unsubscribe attempt |
| `topic:unsub:ok` | Unsubscribe acknowledged |
| `topic:unsub:fail` | Unsubscribe failed |

### Heartbeat Events

| Kind | Description |
|------|-------------|
| `heartbeat:sent` | PINGREQ sent to broker |
| `heartbeat:ok` | PINGRESP received |
| `heartbeat:timeout` | No PINGRESP within timeout window |

## Event Shape

```ts
interface DiagnosticEvent {
  kind: DiagnosticKind;   // Event type
  ts: number;             // Timestamp (Date.now())
  topic?: string;         // Relevant topic (if applicable)
  qos?: DeliveryMode;     // QoS level (if applicable)
  reason?: string;        // Error reason (if applicable)
  elapsed?: number;       // Duration in ms (if applicable)
  endpointInfo?: EndpointInfo;
}
```
