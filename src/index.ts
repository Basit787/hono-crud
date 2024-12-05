import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { Hono } from "hono";
import routes from "./routes/index.js";

const app = new Hono();
config();

const port = Number(process.env.PORT);

app.get("/", (c) => {
  return c.text("Welcome to E-commerce shopping site");
});

//defined routes
app.route("/", routes);

serve({
  fetch: app.fetch,
  port,
});
