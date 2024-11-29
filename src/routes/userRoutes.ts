import { Hono } from "hono";
import * as userController from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

export const userRoutes = new Hono();

userRoutes.get("/", authMiddleware, userController.getAllUsers);
userRoutes.post("/", authMiddleware, isAdmin, userController.registerUser);
userRoutes.get("/:id", authMiddleware, userController.getSingleUser);
userRoutes.delete("/:id", authMiddleware, isAdmin, userController.deleteUser);
userRoutes.put("/:id", authMiddleware, isAdmin, userController.updateUser);
