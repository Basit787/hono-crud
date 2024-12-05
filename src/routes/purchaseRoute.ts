import { Hono } from "hono";
import {
  getAdminOrders,
  getUserOrders,
  purchaseProduct,
} from "../controllers/productPurchaseController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { PurchaseItem } from "../zod/purchaseSchema.js";

export const purchaseRoutes = new Hono();

purchaseRoutes.post(
  "/",
  authMiddleware,
  validate(PurchaseItem),
  purchaseProduct
);
purchaseRoutes.get("/userOrders", authMiddleware, getUserOrders);
purchaseRoutes.get("/getAllOrders", authMiddleware, isAdmin, getAdminOrders);
