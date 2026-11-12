import { AIProviderError, type AIProvider, type CompletionRequest, type CompletionResult } from "./provider.js";
import { defaultSleep, fetchWithTimeout, withRetry, type FetchLike } from "./retry.js";

export type { FetchLike };

export interface AnthropicOptions {
  apiKey: string;
  model: string;
  maxRetries: number;
  fetchImpl?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
}

const ENDPOINT = "https://api.anthropic.com/v1/messages";

/**
 * Anthropic Messages API adapter. Retries only transient failures with
 * exponential backoff, enforces a per-request timeout, and never includes the key in errors.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private readonly fetchImpl: FetchLike;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly opts: AnthropicOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((url, init) => fetch(url, init));
    this.sleep = opts.sleep ?? defaultSleep;
  }

  complete(req: CompletionRequest): Promise<CompletionResult> {
    return withRetry(() => this.once(req), this.opts.maxRetries, this.sleep);
  }

  private async once(req: CompletionRequest): Promise<CompletionResult> {
    const res = await fetchWithTimeout(
      this.fetchImpl,
      ENDPOINT,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.opts.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.opts.model,
          max_tokens: req.maxTokens,
          system: req.system,
          messages: [{ role: "user", content: req.user }],
        }),
      },
      req.timeoutMs,
    );

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
      model?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    if (!text) throw new AIProviderError("AI response contained no text", false);

    return {
      text,
      provider: this.name,
      model: data.model ?? this.opts.model,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    };
  }
}
