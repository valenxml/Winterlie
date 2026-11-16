import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Behind a hosting proxy (Railway, Render), req.ip must come from X-Forwarded-For.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true });
  // Hosting platforms usually set PORT. Fall back to API_PORT for local development.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
