import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { AI_PROVIDER } from "./nest.js";
import type { AIProvider, CompletionRequest, CompletionResult } from "./provider.js";
import { estimateCostMicros, isTimeout, microsToRupiah } from "./usage.logic.js";

/**
 * Every model call goes through here. A row in ai_runs records the tokens, the estimated
 * cost, and the outcome, whether the call succeeded, failed, or timed out.
 */
@Injectable()
export class AiUsageService {
  private readonly rate = Number(process.env.AI_COST_IDR_PER_MTOK ?? 300);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
  ) {}

  async complete(userId: string, tool: string, req: CompletionRequest): Promise<CompletionResult> {
    const run = await this.prisma.aiRun.create({
      data: { userId, tool, provider: this.ai.name, model: "pending", status: "RUNNING", startedAt: new Date() },
      select: { id: true },
    });
    try {
      const result = await this.ai.complete(req);
      await this.prisma.aiRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCEEDED",
          provider: result.provider,
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCostMicros: estimateCostMicros(result.inputTokens + result.outputTokens, this.rate),
          finishedAt: new Date(),
        },
      });
      return result;
    } catch (err) {
      const message = (err as Error).message ?? "Unknown error";
      await this.prisma.aiRun.update({
        where: { id: run.id },
        data: {
          status: isTimeout(message) ? "TIMED_OUT" : "FAILED",
          model: "unknown",
          errorMessage: message.slice(0, 300),
          finishedAt: new Date(),
        },
      });
      throw err;
    }
  }

  /** Usage for one user over the last N days. */
  async summary(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const agg = await this.prisma.aiRun.aggregate({
      where: { userId, createdAt: { gte: since } },
      _count: { id: true },
      _sum: { inputTokens: true, outputTokens: true, estimatedCostMicros: true },
    });
    return {
      days,
      runs: agg._count.id,
      inputTokens: agg._sum.inputTokens ?? 0,
      outputTokens: agg._sum.outputTokens ?? 0,
      estimatedCostIdr: microsToRupiah(agg._sum.estimatedCostMicros ?? 0),
    };
  }
}
