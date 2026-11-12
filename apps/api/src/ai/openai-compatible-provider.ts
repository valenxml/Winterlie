import { AIProviderError, type AIProvider, type CompletionRequest, type CompletionResult } from "./provider.js";
import { defaultSleep, fetchWithTimeout, withRetry, type FetchLike } from "./retry.js";

export interface OpenAICompatibleOptions {
  /** Base URL that ends before /chat/completions, for example https://host/v1 */
  baseUrl: string;
  apiKey: string;
  model: string;
  maxRetries: number;
  fetchImpl?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
}

interface ChatResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string | null }; finish_reason?: string | null }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/**
 * Adapter for any provider that speaks the OpenAI Chat Completions format.
 * Works with OpenAI-compatible resellers and gateways. The key is sent as a bearer
 * header and never appears in the URL or in error messages.
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly name = "openai-compatible";
  private readonly fetchImpl: FetchLike;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly opts: OpenAICompatibleOptions) {
    if (!/^https:\/\//i.test(opts.baseUrl)) {
      throw new Error("AI_BASE_URL must start with https://");
    }
    this.fetchImpl = opts.fetchImpl ?? ((url, init) => fetch(url, init));
    this.sleep = opts.sleep ?? defaultSleep;
  }

  complete(req: CompletionRequest): Promise<CompletionResult> {
    return withRetry(() => this.once(req), this.opts.maxRetries, this.sleep);
  }

  private async once(req: CompletionRequest): Promise<CompletionResult> {
    const url = `${this.opts.baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const res = await fetchWithTimeout(
      this.fetchImpl,
      url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.opts.apiKey}`,
        },
        body: JSON.stringify({
          model: this.opts.model,
          max_tokens: req.maxTokens,
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: req.user },
          ],
          ...(req.json ? { response_format: { type: "json_object" } } : {}),
        }),
      },
      req.timeoutMs,
    );

    const data = (await res.json()) as ChatResponse;
    const choice = data.choices?.[0];
    const text = choice?.message?.content ?? "";
    if (!text) {
      throw new AIProviderError(`AI response was empty${choice?.finish_reason ? ` (${choice.finish_reason})` : ""}`, false);
    }

    return {
      text,
      provider: this.name,
      model: data.model ?? this.opts.model,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    };
  }
}
