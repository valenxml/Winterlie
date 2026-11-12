import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ZodError } from "zod";
import type { Prisma } from "@prisma/client";
import {
  applyCopy, applyDesignOp, buildCopyPrompt, buildLandingDirections, designSpecSchema, DesignOperationError,
  parseAiCopy, parseStoredSpec, type AiCopy, type DesignOp, type DesignSpec,
} from "@workshop/design-schema";
import { AI_PROVIDER } from "../ai/nest.js";
import type { AIProvider } from "../ai/provider.js";
import type { DesignBrief } from "@workshop/validators";
import { PrismaService } from "../prisma.service.js";
import { ProjectsService } from "../projects/projects.service.js";

/** Each direction is stored under its own kind so versions increase per direction. */
const KIND_PREFIX = "design:";

export interface SavedDirection {
  id: string;
  version: number;
  direction: string;
  spec: DesignSpec;
  /** "ai" when the text came from the model, "template" when fallback text was used. */
  source: "ai" | "template";
}

@Injectable()
export class DesignsService {
  private readonly log = new Logger(DesignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
  ) {}

  /**
   * Asks the model for copy. Returns null on any failure (timeout, busy, bad JSON, schema
   * mismatch), so the caller falls back to template text. Errors never reach the user.
   */
  private async fetchAiCopy(brief: DesignBrief): Promise<AiCopy | null> {
    try {
      const { system, user } = buildCopyPrompt({
        brand: brief.businessType ?? "",
        description: brief.description,
      });
      const reply = await this.ai.complete({
        system,
        user,
        maxTokens: 1500,
        timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 60000),
        json: true,
      });
      return parseAiCopy(reply.text);
    } catch (err) {
      this.log.warn(`AI copy unavailable, using template text: ${(err as Error).message}`);
      return null;
    }
  }

  private withCopy(base: DesignSpec[], copy: AiCopy | null): { specs: DesignSpec[]; source: "ai" | "template" } {
    if (!copy) return { specs: base, source: "template" };
    try {
      return { specs: base.map((spec) => applyCopy(spec, copy)), source: "ai" };
    } catch (err) {
      this.log.warn(`AI copy rejected by schema, using template text: ${(err as Error).message}`);
      return { specs: base, source: "template" };
    }
  }

  /** Generates one direction per archetype and stores each as a new version. */
  async generate(userId: string, projectId: string, brief: DesignBrief): Promise<SavedDirection[]> {
    await this.projects.get(userId, projectId); // 404 if the user cannot access the project

    if (brief.category !== "landing") {
      throw new BadRequestException("Kategori dashboard belum tersedia");
    }

    const base = buildLandingDirections({
      brand: brief.businessType ?? "",
      description: brief.description,
    });
    const copy = await this.fetchAiCopy(brief);
    const { specs, source } = this.withCopy(base, copy);

    const saved: SavedDirection[] = [];
    for (const raw of specs) {
      // Validate again before writing: the database should never hold an invalid spec.
      const spec = designSpecSchema.parse(raw);
      const kind = KIND_PREFIX + spec.direction;
      const last = await this.prisma.aiArtifact.findFirst({
        where: { projectId, kind },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const row = await this.prisma.aiArtifact.create({
        data: {
          projectId,
          kind,
          version: (last?.version ?? 0) + 1,
          content: spec as unknown as Prisma.InputJsonValue,
        },
      });
      saved.push({ id: row.id, version: row.version, direction: spec.direction, spec, source });
    }
    return saved;
  }

  /** Latest design artifacts for a project, newest first. */
  async list(userId: string, projectId: string) {
    await this.projects.get(userId, projectId);
    const rows = await this.prisma.aiArtifact.findMany({
      where: { projectId, kind: { startsWith: KIND_PREFIX } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((r) => ({ id: r.id, version: r.version, kind: r.kind, spec: r.content }));
  }

  /**
   * Applies one edit to a stored version and saves the result as the next version.
   * The previous version stays in the database, so history is never lost.
   */
  async applyOp(userId: string, projectId: string, artifactId: string, op: DesignOp) {
    await this.projects.get(userId, projectId);

    const current = await this.prisma.aiArtifact.findFirst({
      where: { id: artifactId, projectId, kind: { startsWith: KIND_PREFIX } },
    });
    if (!current) throw new NotFoundException("Design version not found");

    let next: DesignSpec;
    try {
      next = applyDesignOp(parseStoredSpec(current.content), op);
    } catch (err) {
      if (err instanceof DesignOperationError || err instanceof ZodError) {
        throw new BadRequestException(err instanceof ZodError ? err.issues.map((i) => i.message).join("; ") : err.message);
      }
      throw err;
    }

    const last = await this.prisma.aiArtifact.findFirst({
      where: { projectId, kind: current.kind },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const row = await this.prisma.aiArtifact.create({
      data: {
        projectId,
        kind: current.kind,
        version: (last?.version ?? 0) + 1,
        content: next as unknown as Prisma.InputJsonValue,
      },
    });
    return { id: row.id, version: row.version, direction: next.direction, spec: next };
  }

  /** All saved versions of the same direction, newest first. Used by the version history UI. */
  async listVersions(userId: string, projectId: string, artifactId: string) {
    await this.projects.get(userId, projectId);
    const anchor = await this.prisma.aiArtifact.findFirst({
      where: { id: artifactId, projectId, kind: { startsWith: KIND_PREFIX } },
      select: { kind: true },
    });
    if (!anchor) throw new NotFoundException("Design not found");
    const rows = await this.prisma.aiArtifact.findMany({
      where: { projectId, kind: anchor.kind },
      orderBy: { version: "desc" },
      take: 30,
    });
    return rows.map((r) => ({
      id: r.id,
      version: r.version,
      createdAt: r.createdAt,
      spec: r.content,
    }));
  }
}
