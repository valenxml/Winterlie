import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";

/**
 * TEMPORARY development identity. Reads the user id from the `x-dev-user-id` header
 * and is honored only when AUTH_DEV_BYPASS=true and NODE_ENV is not "production".
 * Replace with real session verification before any deployment.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const enabled = process.env.AUTH_DEV_BYPASS === "true" && process.env.NODE_ENV !== "production";
  const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
  const userId = req.headers["x-dev-user-id"];
  if (!enabled || !userId) throw new UnauthorizedException("Authentication required");
  return userId;
});
