import { serve } from "@hono/node-server";
import { Hono } from "hono";
import routes from "./routes/index.js";
import { config } from "dotenv";

const app = new Hono();
config();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const port = Number(process.env.PORT);

console.log(`Server is running on http://localhost:${port}`);

//defined routes
app.route("/", routes);

serve({
  fetch: app.fetch,
  port,
});
