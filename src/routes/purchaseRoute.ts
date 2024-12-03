import { Hono } from "hono";
import {
  getAdminOrders,
  getUserOrders,
  purchaseProduct,
} from "../controllers/productPurchaseController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

export const purchaseRoutes = new Hono();

purchaseRoutes.post("/", authMiddleware, purchaseProduct);
purchaseRoutes.get("/userOrders", authMiddleware, getUserOrders);
purchaseRoutes.get("/getAllOrders", authMiddleware, isAdmin, getAdminOrders);
