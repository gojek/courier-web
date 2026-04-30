import React, { createContext, useContext, type ReactNode } from "react";
import type { RealtimeClient } from "../RealtimeClient";

const ScopeCtx = createContext<RealtimeClient | null>(null);

export interface RealtimeScopeProps {
  /** An already-constructed {@link RealtimeClient} instance. */
  client: RealtimeClient;
  children: ReactNode;
}

/**
 * Provides a {@link RealtimeClient} to the React component tree.
 *
 * @example
 * ```tsx
 * import { RealtimeClient } from "@gojek/courier-web-sdk";
 * import { RealtimeScope } from "@gojek/courier-web-sdk/react";
 *
 * const client = new RealtimeClient({ ... });
 * await client.connect();
 *
 * function App() {
 *   return (
 *     <RealtimeScope client={client}>
 *       <MyApp />
 *     </RealtimeScope>
 *   );
 * }
 * ```
 */
export function RealtimeScope({ client, children }: RealtimeScopeProps) {
  return <ScopeCtx.Provider value={client}>{children}</ScopeCtx.Provider>;
}

/**
 * Returns the {@link RealtimeClient} from the nearest {@link RealtimeScope}.
 * Throws if called outside of a scope.
 */
export function useRealtimeClient(): RealtimeClient {
  const client = useContext(ScopeCtx);
  if (!client) {
    throw new Error(
      "useRealtimeClient must be used within a <RealtimeScope>. " +
        "Wrap your component tree with <RealtimeScope client={...}>.",
    );
  }
  return client;
}
