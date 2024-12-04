import type { Context, Next } from "hono";
import { z } from "zod";

export const validate = (schema: z.ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const usersData = await c.req.json();
      schema.parse(usersData);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error:
              "Validation error : " + error.errors.map((err) => err.message),
          },
          400
        );
      } else {
        return c.json({ error: "Internal Server Error" + error }, 500);
      }
    }
  };
};
