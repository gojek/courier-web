import type { EndpointConfig } from "../types";
import type { CredentialSource } from "./CredentialSource";

/**
 * Provides fixed credentials that never change.
 * Suitable for development, testing, or short-lived sessions.
 */
export class InlineCredentials implements CredentialSource {
  private cfg: EndpointConfig;

  constructor(cfg: EndpointConfig) {
    this.cfg = cfg;
  }

  async resolve(): Promise<EndpointConfig> {
    return this.cfg;
  }

  /** Replace the stored credentials (e.g. after an external token refresh). */
  swap(cfg: EndpointConfig): void {
    this.cfg = cfg;
  }
}
