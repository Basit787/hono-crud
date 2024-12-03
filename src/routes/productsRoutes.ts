import { Hono } from "hono";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
} from "../controllers/productsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

export const productRoutes = new Hono();

productRoutes.get("/", authMiddleware, getAllProducts);
productRoutes.post("/", authMiddleware, isAdmin, addProduct);
productRoutes.get("/:id", authMiddleware, getSingleProduct);
productRoutes.delete("/:id", authMiddleware, isAdmin, deleteProduct);
productRoutes.put("/:id", authMiddleware, isAdmin, updateProduct);
