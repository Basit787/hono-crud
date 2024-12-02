import { Hono } from "hono";
import * as userController from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const userRoutes = new Hono();

userRoutes.get("/", authMiddleware, userController.getAllUsers);
userRoutes.post("/", authMiddleware, userController.registerUser);
userRoutes.get("/:id", authMiddleware, userController.getSingleUser);
userRoutes.delete("/:id", authMiddleware, userController.deleteUser);
userRoutes.put("/:id", authMiddleware, userController.updateUser);
