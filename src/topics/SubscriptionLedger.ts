import type { Subscription } from "rxjs";
import { LinkState, type DeliveryMode } from "../types";
import type { WireSession } from "../transport/WireSession";

/**
 * Keeps an authoritative ledger of which topics the application expects
 * to be subscribed to, and ensures the broker agrees.
 *
 * Responsibilities:
 *  - Track desired topics.
 *  - Retry failed subscriptions.
 *  - Automatically re-subscribe after a reconnection.
 *  - Periodically audit the broker's state and repair drift (topic audit).
 *
 * This class is domain-agnostic — it knows nothing about conversations,
 * channels, or business objects.  Domain-specific filtering belongs in
 * the consuming application.
 */
export class SubscriptionLedger {
  private readonly desired = new Set<string>();
  private readonly backlog = new Set<string>();
  private auditTimer: ReturnType<typeof setInterval> | null = null;
  private linkSub: Subscription | null = null;

  constructor(
    private session: WireSession,
    private auditIntervalMs?: number,
  ) {
    // Auto-resubscribe whenever the link comes up
    this.linkSub = this.session.state$.subscribe((state) => {
      if (state === LinkState.live) {
        this.reconcile();
        this.drainBacklog();
      }
    });

    // Start periodic audit if configured
    if (auditIntervalMs && auditIntervalMs > 0) {
      this.startAudit(auditIntervalMs);
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Mark `topic` as desired.  If the session is live the subscription
   * is placed immediately; otherwise it lands in the backlog and will
   * be placed once the link is up.
   */
  async add(topic: string, qos?: DeliveryMode): Promise<boolean> {
    if (this.desired.has(topic)) return true;

    if (!this.session.isLive) {
      this.backlog.add(topic);
      return false;
    }

    try {
      await this.session.addTopic(topic, qos);
      this.desired.add(topic);
      this.backlog.delete(topic);
      return true;
    } catch {
      this.backlog.add(topic);
      return false;
    }
  }

  /**
   * Remove `topic` from the ledger entirely — it will not be
   * restored on reconnection.
   */
  async remove(topic: string): Promise<void> {
    this.desired.delete(topic);
    this.backlog.delete(topic);

    if (this.session.isLive) {
      try { await this.session.dropTopic(topic); } catch { /* best-effort */ }
    }
  }

  /**
   * Re-subscribe to every topic in the desired set.
   * Called automatically on reconnection; can also be called manually.
   */
  async reconcile(): Promise<void> {
    if (this.desired.size === 0) return;

    const tasks: Promise<void>[] = [];
    for (const topic of this.desired) {
      tasks.push(
        this.session
          .addTopic(topic)
          .catch(() => { this.backlog.add(topic); }),
      );
    }
    await Promise.allSettled(tasks);
  }

  /** Retry all topics that previously failed. */
  async drainBacklog(): Promise<void> {
    if (this.backlog.size === 0) return;

    const topics = Array.from(this.backlog);
    for (const topic of topics) {
      try {
        await this.session.addTopic(topic);
        this.desired.add(topic);
        this.backlog.delete(topic);
      } catch {
        // stays in backlog
      }
    }
  }

  /**
   * Clear all tracking and re-subscribe from a fresh list.
   * Useful after a major state change (e.g. user changed availability).
   */
  async reset(topics: string[], qos?: DeliveryMode): Promise<void> {
    this.desired.clear();
    this.backlog.clear();

    for (const topic of topics) {
      await this.add(topic, qos);
    }
  }

  // ── Audit ────────────────────────────────────────────────────────────────

  startAudit(intervalMs: number = 10_000): void {
    this.stopAudit();
    this.auditTimer = setInterval(() => {
      this.audit();
    }, intervalMs);
  }

  stopAudit(): void {
    if (this.auditTimer) {
      clearInterval(this.auditTimer);
      this.auditTimer = null;
    }
  }

  // ── Introspection ────────────────────────────────────────────────────────

  listDesired(): string[] {
    return Array.from(this.desired);
  }

  listBacklog(): string[] {
    return Array.from(this.backlog);
  }

  get desiredCount(): number {
    return this.desired.size;
  }

  get backlogCount(): number {
    return this.backlog.size;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  teardown(): void {
    this.stopAudit();
    this.linkSub?.unsubscribe();
    this.linkSub = null;
    this.desired.clear();
    this.backlog.clear();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  /**
   * Compare our desired set against what the session-layer actually
   * has tracked.  Re-subscribe anything that drifted.
   */
  private async audit(): Promise<void> {
    if (!this.session.isLive) return;

    const brokerSet = new Set(this.session.listTracked());
    const drifted: string[] = [];

    for (const topic of this.desired) {
      if (!brokerSet.has(topic)) {
        drifted.push(topic);
      }
    }

    if (drifted.length === 0) return;

    for (const topic of drifted) {
      try {
        await this.session.addTopic(topic);
      } catch {
        // next audit cycle will retry
      }
    }
  }
}
