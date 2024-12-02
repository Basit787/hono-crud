import type { Context, Next } from "hono";

export const isAdmin = async (c: Context, next: Next) => {
  const user = c.get("user");
  if (user.role.toLowerCase() !== "admin") {
    return c.json({ message: "Only admin can perform this action" }, 403);
  }
  await next();
};
