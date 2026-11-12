import type { AIProvider, CompletionRequest, CompletionResult } from "./provider.js";

/**
 * Deterministic provider for development and tests. Returns the fixed text if
 * given, otherwise a stub. Never performs network I/O.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock";

  constructor(private readonly fixed?: string) {}

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const text = this.fixed ?? `MOCK RESPONSE for: ${req.user.slice(0, 80)}`;
    return {
      text,
      provider: this.name,
      model: "mock-1",
      inputTokens: Math.ceil((req.system.length + req.user.length) / 4),
      outputTokens: Math.ceil(text.length / 4),
    };
  }
}
