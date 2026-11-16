/**
 * Sliding-window rate limiter kept in memory. Good for one API instance.
 * With several instances, move the same logic to Redis so all instances share the counts.
 */
export interface LimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  hit(key: string, now: number = Date.now()): LimitResult {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return { allowed: false, remaining: 0, retryAfterMs: recent[0]! + this.windowMs - now };
    }

    recent.push(now);
    this.hits.set(key, recent);
    return { allowed: true, remaining: this.limit - recent.length, retryAfterMs: 0 };
  }

  /** Drops keys with no hits left in the window, so memory stays bounded. */
  prune(now: number = Date.now()): void {
    for (const [key, times] of this.hits) {
      const recent = times.filter((t) => t > now - this.windowMs);
      if (recent.length > 0) this.hits.set(key, recent);
      else this.hits.delete(key);
    }
  }
}
