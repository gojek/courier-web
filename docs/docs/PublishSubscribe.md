---
id: PublishSubscribe
title: Publish & Subscribe
sidebar_position: 6
---

# Publish & Subscribe

## Subscribe to a Topic

```ts
await client.subscribe("my/topic");
```

Subscriptions are managed by the `SubscriptionLedger` and will be automatically:
- **Restored** after any reconnection (network drop, auth refresh, stale connection)
- **Retried** if the initial subscribe fails (queued in backlog)
- **Audited** periodically if `topicAudit` is enabled

### With QoS

```ts
import { DeliveryMode } from "@armaanjain/courier-web-sdk";

await client.subscribe("my/topic", DeliveryMode.atLeastOnce);
```

## Unsubscribe from a Topic

```ts
await client.unsubscribe("my/topic");
```

This removes the topic from the ledger entirely — it will **not** be restored on reconnection.

## Receive Messages

### Callback API

```ts
// All topics
const off = client.onEnvelope((topic, data, raw) => {
  console.log(topic, data);
});

// Specific topic
const off = client.onEnvelope("my/topic", (topic, data, raw) => {
  console.log(data);
});

// Stop listening
off();
```

The `data` parameter is the payload automatically JSON-parsed. If parsing fails, the raw string is returned. The `raw` parameter contains the original `Envelope` with the binary `Uint8Array` payload.

### RxJS API

```ts
import { filter } from "rxjs";

// All messages
client.envelopes$.subscribe((envelope) => {
  console.log(envelope.topic, envelope.payload);
});

// Filtered
client.envelopes$
  .pipe(filter((e) => e.topic.startsWith("chat/")))
  .subscribe((envelope) => {
    console.log(envelope);
  });
```

## Publish Messages

```ts
// Object payload — auto-serialized to JSON
await client.publish("my/topic", { key: "value" });

// Binary payload
const binary = new TextEncoder().encode("raw data");
await client.publish("my/topic", binary);

// With QoS
await client.publish("my/topic", { key: "value" }, DeliveryMode.atLeastOnce);
```

## List Subscribed Topics

```ts
const topics = client.getSubscribedTopics();
console.log("Subscribed to:", topics);
```
