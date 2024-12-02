import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { Hono } from "hono";
import routes from "./routes/index.js";
import { createTables } from "./config/migrations/createTables.js";

const app = new Hono();
config();

app.get("/", (c) => {
  return c.text("Welcome to E-commerce shopping site");
});

createTables().catch((err) => console.error("Error creating table:", err));

const port = Number(process.env.PORT);

console.log(`Server is running on http://localhost:${port}`);

//defined routes
app.route("/", routes);

serve({
  fetch: app.fetch,
  port,
});
