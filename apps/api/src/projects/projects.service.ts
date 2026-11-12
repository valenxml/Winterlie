import { Injectable, NotFoundException } from "@nestjs/common";
import type { ProjectCreateInput, ProjectUpdateInput } from "@workshop/validators";
import { PrismaService } from "../prisma.service.js";

/**
 * Every query is scoped through workspace membership. A project the user cannot
 * access is reported as NotFound, never Forbidden, so IDs cannot be probed.
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private accessWhere(userId: string) {
    return { workspace: { members: { some: { userId } } } };
  }

  async ensurePersonalWorkspace(userId: string): Promise<string> {
    const existing = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspace: { type: "PERSONAL" } },
      select: { workspaceId: true },
    });
    if (existing) return existing.workspaceId;

    const ws = await this.prisma.workspace.create({
      data: { name: "Personal", type: "PERSONAL", members: { create: { userId, role: "OWNER" } } },
      select: { id: true },
    });
    return ws.id;
  }

  list(userId: string) {
    return this.prisma.project.findMany({
      where: { ...this.accessWhere(userId), archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async get(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({ where: { id, ...this.accessWhere(userId) } });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async create(userId: string, input: ProjectCreateInput) {
    const workspaceId = await this.ensurePersonalWorkspace(userId);
    return this.prisma.project.create({
      data: { workspaceId, name: input.name, description: input.description ?? null },
    });
  }

  async update(userId: string, id: string, input: ProjectUpdateInput) {
    await this.get(userId, id);
    return this.prisma.project.update({ where: { id }, data: input });
  }

  async archive(userId: string, id: string) {
    await this.get(userId, id);
    return this.prisma.project.update({ where: { id }, data: { archivedAt: new Date() } });
  }
}
