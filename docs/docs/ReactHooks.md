---
id: ReactHooks
title: React Hooks
sidebar_position: 14
---

# React Hooks

## Setup

Wrap your application with `RealtimeScope` to provide the client to all hooks:

```tsx
import { RealtimeClient } from "@armaanjain/courier-web-sdk";
import { RealtimeScope } from "@armaanjain/courier-web-sdk/react";

const client = new RealtimeClient({ endpoint: { ... } });
await client.connect();

function App() {
  return (
    <RealtimeScope client={client}>
      <MyApp />
    </RealtimeScope>
  );
}
```

## `useLinkStatus`

Track connection state and heartbeat health:

```tsx
import { useLinkStatus } from "@armaanjain/courier-web-sdk/react";

function ConnectionBadge() {
  const { linkState, heartbeatOk, isLive } = useLinkStatus();

  return (
    <div>
      <span>State: {linkState}</span>
      <span>Heartbeat: {heartbeatOk ? "OK" : "Degraded"}</span>
      <span>{isLive ? "Online" : "Offline"}</span>
    </div>
  );
}
```

### Return Type

| Field | Type | Description |
|-------|------|-------------|
| `linkState` | `LinkState` | Current connection state |
| `heartbeatOk` | `boolean` | Last heartbeat succeeded |
| `isLive` | `boolean` | Shorthand for `linkState === LinkState.live` |

## `useTopicBind`

Declaratively subscribe to a topic. Subscribes on mount, unsubscribes on unmount. The subscription is tracked by the ledger and survives reconnections.

```tsx
import { useTopicBind } from "@armaanjain/courier-web-sdk/react";

function ChatRoom({ roomId }: { roomId: string }) {
  const { bound, error } = useTopicBind(`chat/room/${roomId}`);

  if (error) return <div>Failed to subscribe</div>;
  if (!bound) return <div>Subscribing...</div>;
  return <div>Subscribed to room {roomId}</div>;
}
```

Pass `null` to conditionally skip subscription:

```tsx
const { bound } = useTopicBind(isReady ? `chat/room/${roomId}` : null);
```

### Return Type

| Field | Type | Description |
|-------|------|-------------|
| `bound` | `boolean` | `true` once broker acknowledges |
| `error` | `Error \| null` | Non-null if subscribe failed |

## `useInbox`

Listen for messages on a topic (or all topics):

```tsx
import { useInbox } from "@armaanjain/courier-web-sdk/react";

function MessageLog({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);

  useInbox(`chat/room/${roomId}`, (topic, data) => {
    setMessages((prev) => [...prev, data]);
  });

  return (
    <ul>
      {messages.map((msg, i) => (
        <li key={i}>{JSON.stringify(msg)}</li>
      ))}
    </ul>
  );
}
```

Listen to all topics:

```tsx
useInbox((topic, data) => {
  console.log(`[${topic}]`, data);
});
```

## `useRealtimeClient`

Direct access to the `RealtimeClient` instance:

```tsx
import { useRealtimeClient } from "@armaanjain/courier-web-sdk/react";

function PublishButton() {
  const client = useRealtimeClient();

  const send = async () => {
    await client.publish("chat/room/42", { text: "Hello!" });
  };

  return <button onClick={send}>Send</button>;
}
```

## Complete Example

```tsx
import { RealtimeClient, DeliveryMode } from "@armaanjain/courier-web-sdk";
import {
  RealtimeScope,
  useLinkStatus,
  useTopicBind,
  useInbox,
  useRealtimeClient,
} from "@armaanjain/courier-web-sdk/react";
import { useState } from "react";

const client = new RealtimeClient({
  endpoint: {
    host: "broker.example.com",
    port: 443,
    scheme: "wss",
    path: "/mqtt",
    clientId: "react-app",
    username: "user",
    password: "token",
  },
  topicAudit: { enabled: true },
});

client.connect();

export default function App() {
  return (
    <RealtimeScope client={client}>
      <Chat />
    </RealtimeScope>
  );
}

function Chat() {
  const { isLive } = useLinkStatus();
  const { bound } = useTopicBind("chat/room/general");
  const client = useRealtimeClient();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useInbox("chat/room/general", (_, data: any) => {
    setMessages((prev) => [...prev, data.text]);
  });

  const send = async () => {
    if (input.trim()) {
      await client.publish("chat/room/general", { text: input });
      setInput("");
    }
  };

  if (!isLive) return <p>Connecting...</p>;
  if (!bound) return <p>Joining room...</p>;

  return (
    <div>
      <ul>
        {messages.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}
```
