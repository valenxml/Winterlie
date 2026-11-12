import { AIProviderError } from "./provider.js";

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Retries only errors marked retryable, with exponential backoff. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err instanceof AIProviderError && err.retryable;
      if (!retryable || attempt >= maxRetries) throw err;
      await sleep(500 * 2 ** attempt);
      attempt += 1;
    }
  }
}

/** Shared HTTP status policy: transient errors are retried, client errors are not. */
export const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

/** Runs a fetch with a timeout and converts failures into AIProviderError. Never includes secrets. */
export async function fetchWithTimeout(
  fetchImpl: FetchLike,
  url: string,
  init: Omit<RequestInit, "signal">,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      throw new AIProviderError(`AI provider returned ${res.status}`, RETRYABLE_STATUS.has(res.status), res.status);
    }
    return res;
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    const aborted = (err as Error).name === "AbortError";
    throw new AIProviderError(aborted ? "AI request timed out" : "AI network error", true);
  } finally {
    clearTimeout(timer);
  }
}
