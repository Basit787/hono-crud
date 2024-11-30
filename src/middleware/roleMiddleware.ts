import type { Context, Next } from "hono";

export const isAdmin = async (c: Context, next: Next) => {
  const user = c.get("user");
  if (user.role.toLowerCase() !== "admin") {
    return c.json(
      { message: "Only admin can add, update or delete the users" },
      403
    );
  }
  await next();
};
