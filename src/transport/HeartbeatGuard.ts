import { Subject, type Observable } from "rxjs";

/**
 * Monitors the health of a broker connection by tracking heartbeat
 * round-trips.  If a response is not received within the configured
 * window, the connection is marked stale and the registered callback
 * is invoked.
 */
export class HeartbeatGuard {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private sentAt = 0;
  private alive = false;
  private readonly aliveSubject = new Subject<boolean>();
  private onStale: (() => void) | null = null;

  constructor(private windowMs: number = 10_000) {}

  /** Observable that emits whenever liveness changes. */
  get liveness$(): Observable<boolean> {
    return this.aliveSubject.asObservable();
  }

  get isAlive(): boolean {
    return this.alive;
  }

  /** Register a callback invoked when the connection is deemed stale. */
  set onStaleDetected(cb: (() => void) | null) {
    this.onStale = cb;
  }

  /** Call when a heartbeat request is sent. */
  beat(): void {
    this.clearTimer();
    this.sentAt = Date.now();

    this.timer = setTimeout(() => {
      this.setAlive(false);
      this.onStale?.();
    }, this.windowMs);
  }

  /** Call when a heartbeat response is received. Returns latency in ms. */
  ack(): number {
    const latency = this.sentAt > 0 ? Date.now() - this.sentAt : 0;
    this.clearTimer();
    this.setAlive(true);
    return latency;
  }

  /** Mark alive (e.g. on first successful handshake). */
  markUp(): void {
    this.setAlive(true);
  }

  /** Mark down and clear timers (e.g. on disconnect). */
  markDown(): void {
    this.clearTimer();
    this.setAlive(false);
  }

  teardown(): void {
    this.clearTimer();
    this.aliveSubject.complete();
  }

  // ---------------------------------------------------------------------------

  private setAlive(value: boolean): void {
    if (this.alive !== value) {
      this.alive = value;
      this.aliveSubject.next(value);
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
