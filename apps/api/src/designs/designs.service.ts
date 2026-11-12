import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ZodError } from "zod";
import type { Prisma } from "@prisma/client";
import {
  applyDesignOp, buildLandingDirections, designSpecSchema, DesignOperationError, parseStoredSpec,
  type DesignOp, type DesignSpec,
} from "@workshop/design-schema";
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
}

@Injectable()
export class DesignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  /** Generates one direction per archetype and stores each as a new version. */
  async generate(userId: string, projectId: string, brief: DesignBrief): Promise<SavedDirection[]> {
    await this.projects.get(userId, projectId); // 404 if the user cannot access the project

    if (brief.category !== "landing") {
      throw new BadRequestException("Kategori dashboard belum tersedia");
    }

    const specs = buildLandingDirections({
      brand: brief.businessType ?? "",
      description: brief.description,
    });

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
      saved.push({ id: row.id, version: row.version, direction: spec.direction, spec });
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
}
