export interface CompletionRequest {
  system: string;
  user: string;
  maxTokens: number;
  timeoutMs: number;
  /** Ask the provider for JSON output when it supports it. */
  json?: boolean;
}

export interface CompletionResult {
  text: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/** Every AI call goes through this interface. Output is untrusted text and must be validated by the caller. */
export interface AIProvider {
  readonly name: string;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
  }
}
