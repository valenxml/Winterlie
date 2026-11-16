import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, ServiceUnavailableException } from "@nestjs/common";
import { buildAuthUrl, exchangeCode, signState, validateClaims, verifyState, type GoogleConfig } from "./google.js";
import type { Request, Response } from "express";
import { LimitsService } from "../common/limits.service.js";
import { loginSchema, registerSchema, verifyOtpSchema } from "@workshop/validators";
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
  constructor(
    private readonly auth: AuthService,
    private readonly limits: LimitsService,
  ) {}

  /** Step 1: send a verification code to the email. No account is created yet. */
  @Post("register/request")
  @HttpCode(200)
  requestRegister(@Req() req: Request, @Body() body: unknown) {
    this.limits.enforce("otpIp", req.ip ?? "unknown");
    return this.auth.requestRegisterOtp(parseBody(registerSchema, body));
  }

  /** Step 2: confirm the code. The account is created here and the session is set. */
  @Post("register/verify")
  @HttpCode(200)
  async verifyRegister(@Req() req: Request, @Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    this.limits.enforce("authIp", req.ip ?? "unknown");
    const input = parseBody(verifyOtpSchema, body);
    const user = await this.auth.verifyRegisterOtp(input.email, input.code);
    setSessionCookie(res, user.id);
    return user;
  }

  @Post("login")
  @HttpCode(200)
  async login(@Req() req: Request, @Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    this.limits.enforce("authIp", req.ip ?? "unknown");
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

  /** Starts Google sign-in: redirects the browser to Google with a signed state. */
  @Get("google")
  googleStart(@Res() res: Response) {
    const cfg = googleConfig();
    res.redirect(buildAuthUrl(cfg, signState(secret())));
  }

  /** Google returns here with a code. The code is exchanged on the server, then a session is set. */
  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Res() res: Response,
  ) {
    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    const fail = (reason: string) => res.redirect(`${webOrigin}/login?error=${encodeURIComponent(reason)}`);

    if (error || !code || !state) return fail("google_dibatalkan");
    if (!verifyState(state, secret())) return fail("google_state");

    try {
      const cfg = googleConfig();
      const claims = await exchangeCode(cfg, code);
      const email = validateClaims(claims, cfg.clientId);
      const user = await this.auth.loginWithGoogle(email, claims.name);
      const secure = process.env.NODE_ENV === "production";
      res.cookie(SESSION_COOKIE, signSession(user.id, secret()), {
        httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: SESSION_TTL_MS,
      });
      return res.redirect(`${webOrigin}/dashboard`);
    } catch {
      return fail("google_gagal");
    }
  }

  @Get("me")
  me(@CurrentUser() userId: string) {
    return this.auth.me(userId);
  }
}

function googleConfig(): GoogleConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/auth/google/callback";
  if (!clientId || !clientSecret) {
    throw new ServiceUnavailableException("Login Google belum dikonfigurasi");
  }
  return { clientId, clientSecret, redirectUri };
}
