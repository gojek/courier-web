---
id: CredentialStorage
title: Credential Storage
sidebar_position: 8
---

# Credential Storage

## BrowserVault

`BrowserVault` persists connection credentials in browser cookies so they survive page reloads without requiring a fresh API call.

### Usage

```ts
import { BrowserVault } from "@gojek/courier-web-sdk";

const vault = new BrowserVault("myapp_", 30); // prefix, TTL in days
```

### Store Credentials

```ts
vault.store({
  host: "broker.example.com",
  port: 443,
  clientId: "client-123",
  username: "user",
  password: "token",
  scheme: "wss",
  path: "/mqtt",
  topic: "my/default/topic",  // optional
});
```

### Retrieve Credentials

```ts
const saved = vault.retrieve();
// Returns EndpointConfig | null

if (saved) {
  const client = new RealtimeClient({ endpoint: saved });
} else {
  // No saved credentials — fetch from API
}
```

Returns `null` if essential fields (`host`, `clientId`, `username`, `password`) are missing.

### Clear Credentials

```ts
vault.purge();
```

### How It Works

Each field is stored as a separate cookie with the configured prefix:

| Cookie | Content |
|--------|---------|
| `myapp_h` | host |
| `myapp_p` | port |
| `myapp_cid` | clientId |
| `myapp_u` | username |
| `myapp_pw` | password |
| `myapp_sc` | scheme |
| `myapp_pa` | path |
| `myapp_cs` | cleanSession |
| `myapp_ka` | keepAliveSeconds |
| `myapp_t` | topic (optional) |

Cookies are set with `SameSite=Lax` and the configured TTL (default 30 days).
