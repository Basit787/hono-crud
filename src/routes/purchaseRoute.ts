import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { purchaseProduct } from "../controllers/productPurchaseController.js";
import { getAllOrders } from "../controllers/getAllOrders.js";

export const purchaseRoutes = new Hono();

purchaseRoutes.post("/", authMiddleware, purchaseProduct);
purchaseRoutes.get("/orders", authMiddleware, getAllOrders);
