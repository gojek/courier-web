---
id: Configuration
title: Configuration
sidebar_position: 5
---

# Configuration

## Full Configuration Reference

```ts
new RealtimeClient({
  // Required — broker credentials
  endpoint: {
    host: "broker.example.com",
    port: 443,
    scheme: "wss",
    path: "/mqtt",
    clientId: "my-client",
    username: "user",
    password: "token",
    cleanSession: false,
    keepAliveSeconds: 15,
  },

  // Optional — auto-recover from expired tokens
  onAuthFailure: async () => {
    const fresh = await myApi.refreshToken();
    return { host: "...", port: 443, ...fresh };
  },

  // Optional — timing
  reconnectInterval: 50,
  handshakeTimeout: 30000,
  heartbeatTimeout: 10000,

  // Optional — retry backoff
  retryBackoff: {
    baseSeconds: 1,
    ceilSeconds: 60,
  },

  // Optional — subscription health audit
  topicAudit: {
    enabled: true,
    intervalMs: 10000,
  },
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `EndpointConfig` | required | Broker connection parameters |
| `onAuthFailure` | `() => Promise<EndpointConfig>` | — | Called on auth error; returns fresh credentials |
| `reconnectInterval` | `number` | `50` | ms between auto-reconnect attempts |
| `handshakeTimeout` | `number` | `30000` | ms to wait for CONNECT acknowledgement |
| `heartbeatTimeout` | `number` | `10000` | ms to wait for PINGRESP before marking stale |
| `retryBackoff.baseSeconds` | `number` | `1` | Initial retry delay in seconds |
| `retryBackoff.ceilSeconds` | `number` | `60` | Maximum retry delay in seconds |
| `topicAudit.enabled` | `boolean` | `false` | Enable periodic subscription verification |
| `topicAudit.intervalMs` | `number` | `10000` | Audit interval in milliseconds |
