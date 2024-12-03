import { Hono } from "hono";
import { userRoutes } from "./userRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { productRoutes } from "./productsRoutes.js";
import { purchaseRoutes } from "./purchaseRoute.js";

const routes = new Hono();

routes.route("/login", authRoutes);
routes.route("/users", userRoutes);
routes.route("/products", productRoutes);
routes.route("/purchase", purchaseRoutes);

export default routes;
