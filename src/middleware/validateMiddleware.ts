import type { Context, Next } from "hono";
import type { z, ZodError } from "zod";

export const validate = (schema: z.ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const usersData = await c.req.json();
      schema.parse(usersData);
      await next();
    } catch (error) {
      return c.json({ error: (error as ZodError).issues[0].message }, 400);
    }
  };
};
