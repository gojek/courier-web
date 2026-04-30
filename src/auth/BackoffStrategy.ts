import type { RetryStrategy } from "../types";

/**
 * Exponential back-off strategy.
 *
 * Each call to {@link getDelay} doubles the wait time (capped at
 * `ceilSeconds`).  Call {@link reset} after a successful operation.
 */
export class ExponentialBackoff implements RetryStrategy {
  private current: number;

  constructor(
    private base: number = 1,
    private ceil: number = 60,
  ) {
    this.current = base;
  }

  getDelay(_error?: unknown): number {
    const seconds = this.current;
    this.current = Math.min(this.current * 2, this.ceil);
    return seconds;
  }

  reset(): void {
    this.current = this.base;
  }
}
