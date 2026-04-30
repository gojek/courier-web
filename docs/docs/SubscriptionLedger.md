---
id: SubscriptionLedger
title: Subscription Ledger
sidebar_position: 11
---

# Subscription Ledger

## Overview

The `SubscriptionLedger` maintains an authoritative record of which topics your application expects to be subscribed to, and ensures the broker agrees. It is created automatically by `RealtimeClient` and accessible via `client.subscriptions`.

## Automatic Behaviors

### Reconnection Recovery

When the connection is restored after a drop, the ledger automatically re-subscribes to every topic in the desired set.

### Backlog Retry

If a subscribe attempt fails (e.g. because the connection wasn't ready), the topic is placed in a backlog. The backlog is drained automatically on the next successful connection.

### Periodic Audit

When `topicAudit` is enabled, the ledger periodically compares its desired set against what the transport layer actually has subscribed. Any drift is repaired automatically.

```ts
const client = new RealtimeClient({
  endpoint: { ... },
  topicAudit: {
    enabled: true,
    intervalMs: 10000,  // Check every 10 seconds
  },
});
```

## Advanced API

Access the ledger directly for advanced use cases:

```ts
const ledger = client.subscriptions;

// List desired topics
ledger.listDesired();    // ["topic/a", "topic/b"]

// List topics that failed to subscribe
ledger.listBacklog();    // ["topic/c"]

// Counts
ledger.desiredCount;     // 2
ledger.backlogCount;     // 1

// Force a full reset with a new topic list
await ledger.reset(["topic/x", "topic/y", "topic/z"]);

// Manually trigger reconciliation
await ledger.reconcile();

// Manually drain the backlog
await ledger.drainBacklog();

// Control audit lifecycle
ledger.startAudit(5000);  // Start with 5s interval
ledger.stopAudit();
```
