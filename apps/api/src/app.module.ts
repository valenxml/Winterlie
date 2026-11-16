import { Controller, Get, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { ProjectsController } from "./projects/projects.controller.js";
import { ProjectsService } from "./projects/projects.service.js";
import { AI_PROVIDER, createAIProvider } from "./ai/nest.js";
import { DesignsController } from "./designs/designs.controller.js";
import { DesignsService } from "./designs/designs.service.js";
import { AiController } from "./ai/ai.controller.js";
import { AuthController } from "./auth/auth.controller.js";
import { AuthService } from "./auth/auth.service.js";
import { CreditsController } from "./credits/credits.controller.js";
import { CreditsService } from "./credits/credits.service.js";
import { AiUsageService } from "./ai/ai-usage.service.js";
import { LimitsService } from "./common/limits.service.js";

@Controller("health")
class HealthController {
  @Get()
  check() {
    return { status: "ok" };
  }
}

@Module({
  controllers: [HealthController, ProjectsController, DesignsController, AiController, AuthController, CreditsController],
  providers: [
    PrismaService,
    ProjectsService,
    DesignsService,
    AuthService,
    CreditsService,
    AiUsageService,
    LimitsService,
    { provide: AI_PROVIDER, useFactory: () => createAIProvider() },
  ],
})
export class AppModule {}
