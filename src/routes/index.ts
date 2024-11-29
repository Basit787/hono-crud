import { Hono } from "hono";
import { userRoutes } from "./userRoutes.js";
import { authRoutes } from "./authRoutes.js";

const routes = new Hono();

routes.route("/", authRoutes).route("/users", userRoutes);

export default routes;
