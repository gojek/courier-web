---
id: Authentication
title: Authentication
sidebar_position: 7
---

# Authentication

## Static Credentials

The simplest approach — pass credentials directly in the config:

```ts
const client = new RealtimeClient({
  endpoint: {
    host: "broker.example.com",
    port: 443,
    username: "user",
    password: "my-token",
    // ...
  },
});
```

## Token Refresh on Auth Error

When the broker rejects a connection due to expired credentials (CONNACK code 5), the SDK calls your `onAuthFailure` callback to obtain fresh credentials:

```ts
const client = new RealtimeClient({
  endpoint: { ... },
  onAuthFailure: async () => {
    const response = await fetch("/api/mqtt/token");
    const data = await response.json();
    return {
      host: data.host,
      port: data.port,
      username: data.username,
      password: data.token,
      scheme: "wss",
      path: "/mqtt",
    };
  },
});
```

The SDK will:
1. Detect the auth error
2. Force-disconnect the current session
3. Call `onAuthFailure` to get fresh credentials
4. Wait 2 seconds
5. Reconnect with the new credentials
6. Restore all tracked subscriptions

Multiple simultaneous auth refresh attempts are deduplicated automatically.

## Remote Credentials Provider

For advanced use cases, use `RemoteCredentials` to fetch tokens from an HTTP endpoint:

```ts
import { RemoteCredentials } from "@armaanjain/courier-web-sdk";

const creds = new RemoteCredentials(
  "https://api.example.com/mqtt/token",
  (response) => ({
    host: response.broker.host,
    port: response.broker.port,
    username: response.userId,
    password: response.jwt,
    scheme: "wss",
    path: "/mqtt",
  })
);
```

## Updating Credentials Manually

If you refresh tokens externally, update the client:

```ts
client.updateEndpoint({
  host: "broker.example.com",
  port: 443,
  username: "user",
  password: "new-token",
  scheme: "wss",
  path: "/mqtt",
});
```

The new credentials will be used for the next (re-)connection.

## Retry Backoff

Auth-related retries use exponential backoff:

```ts
const client = new RealtimeClient({
  endpoint: { ... },
  retryBackoff: {
    baseSeconds: 1,    // First retry after 1s
    ceilSeconds: 60,   // Max delay 60s
  },
});
// Retries: 1s → 2s → 4s → 8s → 16s → 32s → 60s → 60s → ...
```
