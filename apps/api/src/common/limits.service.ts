import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { RateLimiter } from "./rate-limit.js";

/**
 * Named limits for the routes that cost money or are abused:
 *  - authIp:  password and code attempts per IP
 *  - otpIp:   sign-up codes requested per IP (stops mass email sending)
 *  - aiUser:  AI-spending actions per signed-in user
 */
const BUCKETS = {
  authIp: () => new RateLimiter(20, 15 * 60 * 1000),
  otpIp: () => new RateLimiter(5, 60 * 60 * 1000),
  aiUser: () => new RateLimiter(30, 60 * 60 * 1000),
} as const;

export type LimitBucket = keyof typeof BUCKETS;

@Injectable()
export class LimitsService {
  private readonly limiters: Record<LimitBucket, RateLimiter> = {
    authIp: BUCKETS.authIp(),
    otpIp: BUCKETS.otpIp(),
    aiUser: BUCKETS.aiUser(),
  };

  constructor() {
    // Clean up idle keys every 10 minutes.
    setInterval(() => {
      for (const limiter of Object.values(this.limiters)) limiter.prune();
    }, 10 * 60 * 1000).unref();
  }

  enforce(bucket: LimitBucket, key: string): void {
    const result = this.limiters[bucket].hit(key);
    if (!result.allowed) {
      const minutes = Math.max(1, Math.ceil(result.retryAfterMs / 60000));
      throw new HttpException(
        { message: `Terlalu banyak permintaan. Coba lagi dalam ${minutes} menit.` },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
