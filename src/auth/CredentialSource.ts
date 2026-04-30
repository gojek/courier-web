import type { EndpointConfig } from "../types";

/**
 * A `CredentialSource` knows how to obtain the credentials required
 * to connect to a broker.  The SDK calls {@link resolve} whenever
 * a (re-)connection is needed.
 */
export interface CredentialSource {
  resolve(): Promise<EndpointConfig>;
}
