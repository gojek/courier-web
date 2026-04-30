import type { EndpointConfig } from "../types";

/**
 * Persists {@link EndpointConfig} in browser cookies so credentials
 * survive page reloads without requiring a fresh API call.
 */
export class BrowserVault {
  constructor(
    private prefix: string = "rtc_",
    private ttlDays: number = 30,
  ) {}

  /** Persist endpoint config to cookies. */
  store(cfg: EndpointConfig & { topic?: string }): void {
    const fields: Record<string, string> = {
      h: cfg.host,
      p: String(cfg.port),
      cid: cfg.clientId ?? "",
      u: cfg.username ?? "",
      pw: cfg.password ?? "",
      sc: cfg.scheme ?? "wss",
      pa: cfg.path ?? "",
      cs: String(cfg.cleanSession ?? false),
      ka: String(cfg.keepAliveSeconds ?? 15),
    };
    if (cfg.topic) fields.t = cfg.topic;

    const expires = new Date();
    expires.setDate(expires.getDate() + this.ttlDays);
    const expiry = `; expires=${expires.toUTCString()}`;

    for (const [key, value] of Object.entries(fields)) {
      document.cookie = `${this.prefix}${key}=${encodeURIComponent(value)}${expiry}; path=/; SameSite=Lax`;
    }
  }

  /**
   * Load endpoint config from cookies.
   * Returns `null` if essential fields are missing.
   */
  retrieve(): (EndpointConfig & { topic?: string }) | null {
    const raw = this.readAll();

    const host = raw.h;
    const clientId = raw.cid;
    const username = raw.u;
    const password = raw.pw;

    if (!host || !clientId || !username || !password) return null;

    const scheme = raw.sc || "wss";
    return {
      host,
      port: Number(raw.p) || (scheme === "wss" ? 443 : 1883),
      clientId,
      username,
      password,
      scheme,
      path: raw.pa || undefined,
      cleanSession: raw.cs === "true",
      keepAliveSeconds: Number(raw.ka) || 15,
      ...(raw.t ? { topic: raw.t } : {}),
    };
  }

  /** Remove all cookies managed by this vault. */
  purge(): void {
    const keys = Object.keys(this.readAll());
    for (const key of keys) {
      document.cookie = `${this.prefix}${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }

  // ---------------------------------------------------------------------------

  private readAll(): Record<string, string> {
    const result: Record<string, string> = {};
    const pairs = document.cookie.split(";");
    for (const pair of pairs) {
      const trimmed = pair.trim();
      if (!trimmed.startsWith(this.prefix)) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.substring(this.prefix.length, eq);
      const value = decodeURIComponent(trimmed.substring(eq + 1));
      if (value) result[key] = value;
    }
    return result;
  }
}
