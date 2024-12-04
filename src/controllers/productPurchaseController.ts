import type { Context } from "hono";
import { pool } from "../config/db.js";
import { PurchaseSchema, type PurchaseType } from "../zod/purchaseSchema.js";

export const purchaseProduct = async (c: Context) => {
  const purchaseData: PurchaseType = await c.req.json();

  const { productId, quantity } = PurchaseSchema.parse(purchaseData);

  try {
    await pool.query("BEGIN");

    const productResult = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );
    if (productResult.rowCount === 0) {
      return c.json({ error: "Product not found" }, 404);
    }
    const product = productResult.rows[0];

    if (product.quantity < 0 || product.quantity < quantity) {
      return c.json({ error: "Product is out of stock" }, 400);
    }

    const totalPrice = quantity * product.amount;

    const user = await c.get("user");
    await pool.query(
      "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
      [quantity, productId]
    );

    await pool.query(
      "INSERT INTO orders (userId, productId, quantity, totalPrice) VALUES ($1, $2, $3, $4) RETURNING *",
      [user.id, productId, quantity, totalPrice]
    );

    await pool.query("COMMIT");

    return c.json({
      message: "Order placed successfully",
      totalPrice: `$${totalPrice}`,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    return c.json({ error: `Error while purchase: ${error}` }, 500);
  }
};

export const getAdminOrders = async (c: Context) => {
  try {
    const result = await pool.query("SELECT * FROM orders");
    return c.json({ orders: result.rows }, 200);
  } catch (error) {
    return c.json(
      { error: "Error while fetching orders", details: error },
      500
    );
  }
};

export const getUserOrders = async (c: Context) => {
  const { id } = c.get("user");
  try {
    const result = await pool.query("SELECT * FROM orders WHERE userId = $1", [
      id,
    ]);
    return c.json({ orders: result.rows }, 200);
  } catch (error) {
    return c.json(
      { error: "Error while fetching orders", details: error },
      500
    );
  }
};
