import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { readCookie, SESSION_COOKIE, verifySession } from "../auth/session.js";

/**
 * Resolves the signed-in user. Order:
 * 1. A valid session cookie (the normal path, and the only one in production).
 * 2. The `x-dev-user-id` header, only when AUTH_DEV_BYPASS=true and NODE_ENV is not production.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();

  const token = readCookie(req.headers.cookie, SESSION_COOKIE);
  if (token) {
    const uid = verifySession(token, process.env.AUTH_SECRET ?? "");
    if (uid) return uid;
  }

  const devEnabled = process.env.AUTH_DEV_BYPASS === "true" && process.env.NODE_ENV !== "production";
  const devUser = req.headers["x-dev-user-id"];
  if (devEnabled && devUser) return devUser;

  throw new UnauthorizedException("Authentication required");
});
