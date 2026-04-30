<a href="https://github.com/gojekfarm/courier-web/actions">
	<img alt="Build Status" src="https://github.com/gojekfarm/courier-web/actions/workflows/build.yml/badge.svg" />
</a>
<a href="https://gojekfarm.github.io/courier-web/">
	<img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
</a>
<a href="https://github.com/gojekfarm/courier-web/graphs/commit-activity">
	<img alt="Maintenance" src="https://img.shields.io/badge/maintained-yes-green.svg" />
</a>
<a href="https://github.com/gojekfarm/courier-web/releases/latest">
	<img alt="GitHub Release Date" src="https://img.shields.io/github/release-date/gojekfarm/courier-web" />
</a>
<a href="https://github.com/gojekfarm/courier-web/commits/main">
	<img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/gojekfarm/courier-web" />
</a>

[![Discord : Gojek Courier](https://img.shields.io/badge/Discord-Gojek%20Courier-blue.svg)](https://discord.gg/C823qK4AK7)

## About Courier Web

Courier Web is a TypeScript SDK for creating robust, long-running connections using the MQTT protocol in web applications.

Long running connection is a persistent connection established between client & server for instant bi-directional communication. A long running connection is maintained for maximum possible duration with the help of keep alive packets.

MQTT is an extremely lightweight protocol which works on publish/subscribe messaging model. It is designed for connections with remote locations where a "small code footprint" is required or the network bandwidth is limited.

The protocol usually runs over TCP/IP via WebSockets in the browser; however, any network protocol that provides ordered, lossless, bi-directional connections can support MQTT.

MQTT has 3 built-in QoS levels for Reliable Message Delivery:

* **QoS 0 (At most once)** - the message is sent only once and the client and broker take no additional steps to acknowledge delivery (fire and forget).

* **QoS 1 (At least once)** - the message is re-tried by the sender multiple times until acknowledgement is received (acknowledged delivery).

* **QoS 2 (Exactly once)** - the sender and receiver engage in a two-level handshake to ensure only one copy of the message is received (assured delivery).

## Detailed Documentation

Find the detailed documentation here - https://gojekfarm.github.io/courier-web/

End-to-end courier example - https://gojek.github.io/courier/docs/Introduction

## Features

* Clean, simple API with callback and RxJS Observable support

* Automatic Reconnection with subscription restoration

* Heartbeat Monitoring with stale connection detection

* Subscription Ledger with periodic broker-side audit

* Exponential Backoff retry for auth and connection failures

* Credential Persistence via cookie-based storage

* Framework-agnostic core with optional React bindings

* Full TypeScript support with comprehensive type definitions

## Getting Started

### Installation

```bash
npm install @gojek/courier-web-sdk
```

### Quick Start

```ts
import { RealtimeClient } from "@gojek/courier-web-sdk";

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
  topicAudit: { enabled: true, intervalMs: 10_000 },
});

await client.connect();
await client.subscribe("chat/room/42");

client.onEnvelope("chat/room/42", (topic, data) => {
  console.log("Received:", data);
});

await client.publish("chat/room/42", { text: "Hello!" });
```

### React Usage

```tsx
import { RealtimeClient } from "@gojek/courier-web-sdk";
import {
  RealtimeScope,
  useLinkStatus,
  useInbox,
  useTopicBind,
} from "@gojek/courier-web-sdk/react";

const client = new RealtimeClient({ endpoint: { ... } });
await client.connect();

function App() {
  return (
    <RealtimeScope client={client}>
      <ChatRoom channelId="42" />
    </RealtimeScope>
  );
}

function ChatRoom({ channelId }: { channelId: string }) {
  const { isLive, heartbeatOk } = useLinkStatus();
  const { bound } = useTopicBind(`chat/room/${channelId}`);

  useInbox(`chat/room/${channelId}`, (topic, data) => {
    console.log("New message:", data);
  });

  if (!isLive) return <div>Connecting...</div>;
  if (!bound) return <div>Subscribing...</div>;
  return <div>Live! Heartbeat: {heartbeatOk ? "OK" : "Degraded"}</div>;
}
```

## Contribution Guidelines

Read our [contribution guide](./CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to the Courier Web SDK.

## License

Courier Web is [MIT Licensed](./LICENSE).
