import { Hono } from "hono";
import { loginUser } from "../controllers/authController.js";
import { validate } from "../middleware/validateMiddleware.js";
import { LoginSchema } from "../zod/loginSchema.js";

export const authRoutes = new Hono();

authRoutes.post("/", validate(LoginSchema), loginUser);
