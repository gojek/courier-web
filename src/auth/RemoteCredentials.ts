import type { EndpointConfig } from "../types";
import type { CredentialSource } from "./CredentialSource";

/**
 * Fetches connection credentials from an HTTP endpoint.
 *
 * An optional `transform` function converts the raw JSON body
 * into {@link EndpointConfig}.  When omitted the response body
 * is used directly (it must already conform to `EndpointConfig`).
 */
export class RemoteCredentials implements CredentialSource {
  constructor(
    private url: string,
    private transform?: (data: unknown) => EndpointConfig,
  ) {}

  async resolve(): Promise<EndpointConfig> {
    const res = await fetch(this.url);
    if (!res.ok) {
      throw new Error(
        `Credential fetch failed: ${res.status} ${res.statusText}`,
      );
    }
    const body = await res.json();
    return this.transform ? this.transform(body) : this.inferConfig(body);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private inferConfig(body: any): EndpointConfig {
    const scheme = body.scheme || "wss";
    return {
      host: body.host,
      port: body.port ?? (scheme === "wss" ? 443 : 1883),
      scheme,
      clientId: body.clientId,
      username: body.username,
      password: body.password,
      cleanSession: body.cleanSession ?? false,
      keepAliveSeconds: body.keepAliveSeconds ?? 15,
      path: body.path,
    };
  }
}
