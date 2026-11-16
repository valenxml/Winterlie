import {
  BadRequestException, HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ZodError } from "zod";
import type { Prisma } from "@prisma/client";
import {
  applyCopy, applyDesignOp, applySectionCopy, archetypeSpecs, buildComposePrompt, buildCopyPrompt, buildLandingDirections,
  buildSectionPrompt, composeSpec, designSpecSchema, DesignOperationError, extractJsonObject, isRegeneratable,
  parseAiCopy, parseComposeReply, parseStoredSpec, sectionCopySchema, type AiCopy, type ComposePlan, type DesignOp,
  type DesignSpec,
} from "@workshop/design-schema";
import { AI_PROVIDER } from "../ai/nest.js";
import { CreditsService } from "../credits/credits.service.js";
import { AiUsageService } from "../ai/ai-usage.service.js";
import { GENERATE_COST, REGENERATE_COST } from "../credits/credits.logic.js";
import { randomUUID } from "node:crypto";
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
  private readonly inflight = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
    private readonly credits: CreditsService,
    private readonly usage: AiUsageService,
  ) {}

  /** Charges credits, runs the action, and refunds the charge if the action throws. */
  private async paid<T>(userId: string, cost: number, action: () => Promise<T>): Promise<T> {
    // One paid action per user at a time. Parallel requests cannot race the balance.
    if (this.inflight.has(userId)) {
      throw new HttpException({ message: "Masih ada proses yang berjalan. Tunggu sebentar." }, HttpStatus.TOO_MANY_REQUESTS);
    }
    this.inflight.add(userId);
    try {
      const runKey = randomUUID();
      await this.credits.charge(userId, cost, `run:${runKey}`);
      try {
        return await action();
      } catch (err) {
        await this.credits.refund(userId, cost, `refund:${runKey}`);
        throw err;
      }
    } finally {
      this.inflight.delete(userId);
    }
  }

  /**
   * Asks the model for copy. Returns null on any failure (timeout, busy, bad JSON, schema
   * mismatch), so the caller falls back to template text. Errors never reach the user.
   */
  private async fetchAiCopy(userId: string, brief: DesignBrief): Promise<AiCopy | null> {
    try {
      const { system, user } = buildCopyPrompt({
        brand: brief.businessType ?? "",
        description: brief.description,
      });
      const reply = await this.usage.complete(userId, "design.copy", {
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

  /** Asks for three structure plans. Returns null on any failure so templates are used instead. */
  private async fetchPlans(userId: string, brief: DesignBrief): Promise<ComposePlan[] | null> {
    try {
      const { system, user } = buildComposePrompt({
        brand: brief.businessType ?? "",
        description: brief.description,
        siteType: brief.siteType,
      });
      const reply = await this.usage.complete(userId, "design.plans", {
        system,
        user,
        maxTokens: 3000,
        timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 60000),
        json: true,
      });
      return parseComposeReply(reply.text);
    } catch (err) {
      this.log.warn(`AI structure unavailable, using template layouts: ${(err as Error).message}`);
      return null;
    }
  }

  private tryArchetype(brief: DesignBrief): DesignSpec[] | null {
    try {
      return archetypeSpecs(brief.description, brief.businessType ?? "", brief.siteType).specs;
    } catch (err) {
      this.log.warn(`Archetype fallback failed: ${(err as Error).message}`);
      return null;
    }
  }

  private tryCompose(plans: ComposePlan[], brief: DesignBrief): DesignSpec[] | null {
    try {
      return plans.map((plan, index) =>
        composeSpec(plan, { brand: brief.businessType ?? "", description: brief.description, index }),
      );
    } catch (err) {
      this.log.warn(`AI structure rejected by schema, using template layouts: ${(err as Error).message}`);
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
    await this.projects.get(userId, projectId); // check access before any credit is spent
    return this.paid(userId, GENERATE_COST, () => this.generateInner(userId, projectId, brief));
  }

  private async generateInner(userId: string, projectId: string, brief: DesignBrief): Promise<SavedDirection[]> {
    await this.projects.get(userId, projectId); // 404 if the user cannot access the project

    if (brief.category !== "landing") {
      throw new BadRequestException("Kategori dashboard belum tersedia");
    }

    let specs: DesignSpec[];
    let source: "ai" | "template";

    const plans = await this.fetchPlans(userId, brief);
    const composed = plans ? this.tryCompose(plans, brief) : null;

    if (composed) {
      specs = composed;
      source = "ai";
    } else {
      // Fallback 1: archetype for the brief's kind of site (shop, game, streaming, or landing).
      // The structure matches the brief even without AI.
      const fromArchetype = this.tryArchetype(brief);
      if (fromArchetype) {
        specs = fromArchetype;
        source = "template";
      } else {
        // Fallback 2: landing templates with AI copy, or plain template copy.
        const base = buildLandingDirections({
          brand: brief.businessType ?? "",
          description: brief.description,
        });
        const copy = await this.fetchAiCopy(userId, brief);
        ({ specs, source } = this.withCopy(base, copy));
      }
    }

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

  /**
   * Rewrites the text of one section with the model and saves the result as a new version.
   * Other sections are unchanged. If the model fails or its output is invalid, nothing is
   * saved and the current version stays in use.
   */
  async regenerateSection(userId: string, projectId: string, artifactId: string, sectionId: string) {
    await this.projects.get(userId, projectId);
    return this.paid(userId, REGENERATE_COST, () => this.regenerateInner(userId, projectId, artifactId, sectionId));
  }

  private async regenerateInner(userId: string, projectId: string, artifactId: string, sectionId: string) {
    await this.projects.get(userId, projectId);

    const current = await this.prisma.aiArtifact.findFirst({
      where: { id: artifactId, projectId, kind: { startsWith: KIND_PREFIX } },
    });
    if (!current) throw new NotFoundException("Design version not found");

    const spec = parseStoredSpec(current.content);
    const section = spec.sections.find((s) => s.id === sectionId);
    if (!section) throw new NotFoundException("Section not found");
    if (!isRegeneratable(section.type)) {
      throw new BadRequestException(`Section ${section.type} belum bisa dibuat ulang`);
    }

    const nav = spec.sections.find((s) => s.type === "navbar");
    const hero = spec.sections.find((s) => s.type.startsWith("hero-"));
    const brand = nav && nav.type === "navbar" ? nav.content.brand : spec.name;
    const description = (hero?.content as { description?: string } | undefined)?.description ?? spec.name;

    let copy: Record<string, unknown>;
    try {
      const { system, user } = buildSectionPrompt(section, { brand, description });
      const reply = await this.usage.complete(userId, "design.section", {
        system,
        user,
        maxTokens: 900,
        timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 60000),
        json: true,
      });
      copy = sectionCopySchema(section.type).parse(extractJsonObject(reply.text)) as Record<string, unknown>;
    } catch (err) {
      this.log.warn(`Section regeneration failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException(
        "AI belum bisa menulis ulang section ini. Versi sekarang tetap dipakai, coba lagi sebentar.",
      );
    }

    let next: DesignSpec;
    try {
      next = applyDesignOp(spec, {
        op: "replace",
        sectionId,
        section: applySectionCopy(section, copy),
      });
    } catch (err) {
      this.log.warn(`Regenerated section rejected by schema: ${(err as Error).message}`);
      throw new ServiceUnavailableException("Teks dari AI tidak sesuai format. Versi sekarang tetap dipakai, coba lagi.");
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
    return { id: row.id, version: row.version, direction: next.direction, spec: next, source: "ai" as const };
  }
}
