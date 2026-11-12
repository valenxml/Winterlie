import { AIProviderError, type AIProvider, type CompletionRequest, type CompletionResult } from "./provider.js";
import { defaultSleep, fetchWithTimeout, withRetry, type FetchLike } from "./retry.js";

export interface GeminiOptions {
  apiKey: string;
  model: string;
  /** Tried in order when the primary model is busy, rate-limited, or missing. */
  fallbackModels?: string[];
  maxRetries: number;
  fetchImpl?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  modelVersion?: string;
}

/**
 * Google Gemini (generateContent) adapter. The key is sent in a header, never in the URL,
 * so it cannot leak into logs or error messages.
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private readonly fetchImpl: FetchLike;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly opts: GeminiOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((url, init) => fetch(url, init));
    this.sleep = opts.sleep ?? defaultSleep;
  }

  private get models(): string[] {
    const all = [this.opts.model, ...(this.opts.fallbackModels ?? [])];
    return [...new Set(all.map((m) => m.trim()).filter(Boolean))];
  }

  /**
   * Tries each model in order. Each model gets its own transient retries first.
   * Falls back only on errors where another model may succeed: busy (503, 500, 502, 504),
   * rate limited (429), timeout or network failure, or model not found (404).
   * Empty or blocked responses are not retried on other models, since they would repeat.
   */
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    let lastError: AIProviderError | undefined;
    for (const model of this.models) {
      try {
        return await withRetry(() => this.once(req, model), this.opts.maxRetries, this.sleep);
      } catch (err) {
        if (!(err instanceof AIProviderError)) throw err;
        if (!(err.retryable || err.status === 404)) throw err;
        lastError = err;
      }
    }
    throw lastError ?? new AIProviderError("No Gemini model configured", false);
  }

  private async once(req: CompletionRequest, model: string): Promise<CompletionResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const res = await fetchWithTimeout(
      this.fetchImpl,
      url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.opts.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [{ role: "user", parts: [{ text: req.user }] }],
          generationConfig: {
            maxOutputTokens: req.maxTokens,
            ...(req.json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      },
      req.timeoutMs,
    );

    const data = (await res.json()) as GeminiResponse;
    const candidate = data.candidates?.[0];
    const text = (candidate?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    if (!text) {
      // Safety blocks and empty candidates are not transient; retrying gives the same result.
      throw new AIProviderError(`AI response was empty${candidate?.finishReason ? ` (${candidate.finishReason})` : ""}`, false);
    }

    return {
      text,
      provider: this.name,
      model: data.modelVersion ?? model,
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }
}
