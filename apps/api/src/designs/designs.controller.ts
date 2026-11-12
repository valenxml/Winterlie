import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { designOpSchema } from "@workshop/design-schema";
import { designBriefSchema } from "@workshop/validators";
import { CurrentUser } from "../common/current-user.js";
import { parseBody } from "../common/parse.js";
import { DesignsService } from "./designs.service.js";

@Controller("projects/:projectId/designs")
export class DesignsController {
  constructor(private readonly designs: DesignsService) {}

  @Get()
  list(@CurrentUser() userId: string, @Param("projectId") projectId: string) {
    return this.designs.list(userId, projectId);
  }

  @Post("generate")
  generate(@CurrentUser() userId: string, @Param("projectId") projectId: string, @Body() body: unknown) {
    return this.designs.generate(userId, projectId, parseBody(designBriefSchema, body));
  }

  @Post(":artifactId/ops")
  applyOp(
    @CurrentUser() userId: string,
    @Param("projectId") projectId: string,
    @Param("artifactId") artifactId: string,
    @Body() body: unknown,
  ) {
    return this.designs.applyOp(userId, projectId, artifactId, parseBody(designOpSchema, body));
  }
}
