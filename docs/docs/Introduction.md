---
id: Introduction
title: Introduction
sidebar_position: 1
slug: /
---

# Courier Web SDK

## About Courier Web

Courier Web is a TypeScript SDK for creating robust, long-running connections using the MQTT protocol in web applications.

Long running connection is a persistent connection established between client & server for instant bi-directional communication. A long running connection is maintained for maximum possible duration with the help of keep alive packets.

MQTT is an extremely lightweight protocol which works on publish/subscribe messaging model. It is designed for connections with remote locations where a "small code footprint" is required or the network bandwidth is limited.

The protocol usually runs over TCP/IP via WebSockets in the browser; however, any network protocol that provides ordered, lossless, bi-directional connections can support MQTT.

MQTT has 3 built-in QoS levels for Reliable Message Delivery:

* **QoS 0 (At most once)** - the message is sent only once and the client and broker take no additional steps to acknowledge delivery (fire and forget).

* **QoS 1 (At least once)** - the message is re-tried by the sender multiple times until acknowledgement is received (acknowledged delivery).

* **QoS 2 (Exactly once)** - the sender and receiver engage in a two-level handshake to ensure only one copy of the message is received (assured delivery).

## Features

* Clean, simple API with callback and RxJS Observable support
* Automatic Reconnection with subscription restoration
* Heartbeat Monitoring with stale connection detection
* Subscription Ledger with periodic broker-side audit
* Exponential Backoff retry for auth and connection failures
* Credential Persistence via cookie-based storage
* Framework-agnostic core with optional React bindings
* Full TypeScript support with comprehensive type definitions

## Architecture

The SDK is composed of several internal layers:

| Layer | Class | Responsibility |
|-------|-------|---------------|
| Transport | `WireSession` | MQTT connection lifecycle, reconnect, auth recovery |
| Health | `HeartbeatGuard` | Ping/pong timeout detection |
| Topics | `SubscriptionLedger` | Subscription tracking, retry, health audit |
| Auth | `InlineCredentials`, `RemoteCredentials` | Credential providers |
| Storage | `BrowserVault` | Cookie-based credential persistence |
| Client | `RealtimeClient` | Public API composing all layers |
