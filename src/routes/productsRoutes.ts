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
import { validate } from "../middleware/validateMiddleware.js";
import { ProductSchema } from "../zod/productSchema.js";

export const productRoutes = new Hono();

productRoutes.get("/", authMiddleware, getAllProducts);
productRoutes.post(
  "/",
  authMiddleware,
  isAdmin,
  validate(ProductSchema),
  addProduct
);
productRoutes.get("/:id", authMiddleware, getSingleProduct);
productRoutes.delete("/:id", authMiddleware, isAdmin, deleteProduct);
productRoutes.put(
  "/:id", // endpoint
  authMiddleware, // check either user is authenticate or not
  isAdmin, // check either the the role is admin or not
  validate(ProductSchema), // check the validations using validation middleware
  updateProduct // controller
);
