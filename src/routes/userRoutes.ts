import { Hono } from "hono";
import * as userController from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

export const userRoutes = new Hono();

userRoutes
  .get("/", authMiddleware, userController.getAllUsers)
  .post(authMiddleware, isAdmin, userController.registerUser)
  .get("/:id", authMiddleware, userController.getSingleUser)
  .delete(authMiddleware, isAdmin, userController.deleteUser)
  .put(authMiddleware, isAdmin, userController.updateUser);
