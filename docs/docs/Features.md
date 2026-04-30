---
id: Features
title: Features Overview
sidebar_position: 9
---

# Features Overview

## Automatic Behaviors

The SDK handles many failure scenarios out of the box with no additional code:

| Scenario | SDK Behavior |
|----------|-------------|
| **Network drops** | Auto-reconnects via mqtt.js, then restores all tracked subscriptions |
| **Token expires** | Calls `onAuthFailure` callback, reconnects with fresh credentials, restores subscriptions |
| **Heartbeat timeout** | Detects stale connection, force-reconnects, restores subscriptions |
| **Subscribe fails** | Queued in backlog, retried automatically on next successful connection |
| **Subscription drift** | Periodic audit detects and repairs missing broker-side subscriptions |
| **Page reload** | Use `BrowserVault` to persist/restore credentials without API calls |

## Dual API

Every stream is available in two forms:

```ts
// Callback API — returns an unsubscribe function
const off = client.onEnvelope((topic, data) => { ... });
off(); // cleanup

// RxJS Observable API — for power users
client.envelopes$.pipe(filter(...), map(...)).subscribe(...);
```

## Framework Agnostic

The core SDK (`@gojek/courier-web-sdk`) has zero framework dependencies. Use it with vanilla JS, Vue, Angular, Svelte, or any other framework.

React bindings are provided as an optional subpath import (`@gojek/courier-web-sdk/react`).

## Full TypeScript Support

Every type, interface, enum, and callback signature is fully typed. The package ships `.d.ts` declaration files for both ESM and CJS.
