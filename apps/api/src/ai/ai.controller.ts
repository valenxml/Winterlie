import { Controller, Inject, Post, ServiceUnavailableException } from "@nestjs/common";
import type { AIProvider } from "./provider.js";
import { AIProviderError } from "./provider.js";
import { AI_PROVIDER } from "./nest.js";
import { CurrentUser } from "../common/current-user.js";

/**
 * Connection check for the configured AI provider. Requires a signed-in user so the
 * endpoint cannot be used to spend the key anonymously.
 */
@Controller("ai")
export class AiController {
  constructor(@Inject(AI_PROVIDER) private readonly ai: AIProvider) {}

  @Post("test")
  async test(@CurrentUser() _userId: string) {
    try {
      const r = await this.ai.complete({
        system: "Kamu adalah asisten singkat. Jawab dengan satu kalimat dalam Bahasa Indonesia.",
        user: "Sebutkan satu hal yang membuat website mudah dipakai.",
        maxTokens: 80,
        timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 60000),
      });
      return { provider: r.provider, model: r.model, text: r.text, inputTokens: r.inputTokens, outputTokens: r.outputTokens };
    } catch (err) {
      if (err instanceof AIProviderError) {
        throw new ServiceUnavailableException(`AI provider tidak tersedia: ${err.message}`);
      }
      throw err;
    }
  }
}
