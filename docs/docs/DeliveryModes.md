---
id: DeliveryModes
title: Delivery Modes (QoS)
sidebar_position: 13
---

# Delivery Modes (QoS)

## Overview

MQTT defines three Quality of Service levels that control message delivery guarantees. The SDK exposes these as the `DeliveryMode` enum.

```ts
import { DeliveryMode } from "@gojek/courier-web-sdk";
```

## Levels

### `DeliveryMode.atMostOnce` (QoS 0)

**Fire and forget.** The message is sent once with no acknowledgement. Fastest but messages can be lost.

```ts
await client.publish("sensors/temp", { value: 22.5 }, DeliveryMode.atMostOnce);
```

Best for: high-frequency telemetry, status updates where occasional loss is acceptable.

### `DeliveryMode.atLeastOnce` (QoS 1)

**Acknowledged delivery.** The message is retried until the broker acknowledges it. Messages may be delivered more than once.

```ts
await client.subscribe("chat/room/42", DeliveryMode.atLeastOnce);
```

Best for: chat messages, notifications — delivery is important but duplicates are tolerable.

### `DeliveryMode.exactlyOnce` (QoS 2)

**Assured delivery.** A four-step handshake ensures exactly one delivery. Slowest but most reliable.

```ts
await client.publish("payments/confirm", data, DeliveryMode.exactlyOnce);
```

Best for: financial transactions, critical state changes where duplicates would cause problems.

## Default

When no QoS is specified, the SDK defaults to `DeliveryMode.atMostOnce` (QoS 0).
