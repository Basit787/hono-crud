import type { Context } from "hono";
import { pool } from "../config/db.js";

export const getAllOrders = async (c: Context) => {
  try {
    const { id, role } = c.get("user");

    if (role === "admin") {
      const result = await pool.query("SELECT * FROM orders");
      return c.json({ orders: result.rows }, 200);
    } else {
      const result = await pool.query(
        "SELECT * FROM orders WHERE userId = $1",
        [id]
      );
      return c.json({ orders: result.rows }, 200);
    }
  } catch (error) {
    return c.json(
      { error: "Error while fetching orders", details: error },
      400
    );
  }
};
