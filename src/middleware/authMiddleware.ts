import type { Context, Next } from "hono";
import { verifyToken } from "../utils/helpers.js";

export const authMiddleware = async (c: Context, next: Next) => {
  //get the header from request
  const authHeader = c.req.header("Authorization");

  //check either header exists or not, if not throw error
  if (!authHeader)
    return c.json({ message: "Authorization header missing" }, 401);

  //seprate token form authorization : "Bearer Token"
  const token = authHeader.split(" ")[1];

  //check either token exists or not
  if (!token) return c.json({ error: "Token required" }, 401);

  // if any error doesnt occurs, return the response
  try {
    const verifiedUser = verifyToken(token);
    c.set("user", verifiedUser);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};
