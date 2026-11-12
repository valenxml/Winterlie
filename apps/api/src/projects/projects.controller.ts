import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { projectCreateSchema, projectUpdateSchema } from "@workshop/validators";
import { ProjectsService } from "./projects.service.js";
import { CurrentUser } from "../common/current-user.js";
import { parseBody as parse } from "../common/parse.js";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@CurrentUser() userId: string) {
    return this.projects.list(userId);
  }

  @Post()
  create(@CurrentUser() userId: string, @Body() body: unknown) {
    return this.projects.create(userId, parse(projectCreateSchema, body));
  }

  @Get(":id")
  get(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.projects.get(userId, id);
  }

  @Patch(":id")
  update(@CurrentUser() userId: string, @Param("id") id: string, @Body() body: unknown) {
    return this.projects.update(userId, id, parse(projectUpdateSchema, body));
  }

  @Delete(":id")
  archive(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.projects.archive(userId, id);
  }
}
