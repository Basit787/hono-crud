import type { Context, Next } from "hono";

export const isAdmin = async (c: Context, next: Next) => {
  // check the role of user by getting it form user, user is object key which we set during token verify in auth middleware
  const user = c.get("user");
  if (user.role.toLowerCase() !== "admin") {
    return c.json({ message: "Only admin can perform this action" }, 403);
  }
  await next();
};
