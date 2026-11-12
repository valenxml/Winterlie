import { BadRequestException } from "@nestjs/common";
import type { z, ZodTypeAny } from "zod";

/**
 * Validates request bodies and returns the parsed output type.
 * Accepts any zod schema, including ones with defaults where input and output types differ.
 */
export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(
      result.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "),
    );
  }
  return result.data as z.output<S>;
}
