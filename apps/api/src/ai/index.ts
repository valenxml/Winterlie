import type { AIProvider } from "./provider.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { GeminiProvider } from "./gemini-provider.js";
import { MockProvider } from "./mock-provider.js";

export * from "./provider.js";

/**
 * Builds the provider from env. Defaults to mock so development works without any key.
 * Set AI_DEFAULT_PROVIDER to "anthropic" or "gemini" and provide the matching key.
 */
export function createAIProvider(env: NodeJS.ProcessEnv = process.env): AIProvider {
  const choice = env.AI_DEFAULT_PROVIDER ?? "mock";
  const maxRetries = Number(env.AI_MAX_RETRIES ?? 2);

  if (choice === "anthropic") {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI_DEFAULT_PROVIDER=anthropic requires ANTHROPIC_API_KEY");
    return new AnthropicProvider({ apiKey, model: env.AI_MODEL ?? "claude-haiku-5-5", maxRetries });
  }

  if (choice === "gemini") {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI_DEFAULT_PROVIDER=gemini requires GEMINI_API_KEY");
    const fallbackModels = (env.GEMINI_FALLBACK_MODELS ?? "").split(",").map((m) => m.trim()).filter(Boolean);
    return new GeminiProvider({ apiKey, model: env.GEMINI_MODEL ?? "gemini-3.8-flash", fallbackModels, maxRetries });
  }

  return new MockProvider();
}
