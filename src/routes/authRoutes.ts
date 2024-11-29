import { Hono } from "hono";
import { loginUser } from "../controllers/authController.js";

export const authRoutes = new Hono();

authRoutes.post("/login", loginUser);
