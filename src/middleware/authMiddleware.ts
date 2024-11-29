import type { Context, Next } from "hono";
import { verifyToken } from "../utils/helpers.js";

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader)
    return c.json({ message: "Authorization header missing" }, 401);

  const token = authHeader.split(" ")[1];
  if (!token) return c.json({ error: "Token required" }, 401);

  try {
    const verifiedUser = verifyToken(token);
    c.set("user", verifiedUser);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};
