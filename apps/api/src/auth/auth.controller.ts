import { Body, Controller, Get, HttpCode, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { loginSchema, registerSchema } from "@workshop/validators";
import { CurrentUser } from "../common/current-user.js";
import { parseBody } from "../common/parse.js";
import { AuthService } from "./auth.service.js";
import { SESSION_COOKIE, SESSION_TTL_MS, signSession } from "./session.js";

function secret(): string {
  const value = process.env.AUTH_SECRET ?? "";
  if (value.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters");
  return value;
}

function setSessionCookie(res: Response, userId: string): void {
  const secure = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, signSession(userId, secret()), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.register(parseBody(registerSchema, body));
    setSessionCookie(res, user.id);
    return user;
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.login(parseBody(loginSchema, body));
    setSessionCookie(res, user.id);
    return user;
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  }

  @Get("me")
  me(@CurrentUser() userId: string) {
    return this.auth.me(userId);
  }
}
