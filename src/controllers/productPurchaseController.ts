import type { Context } from "hono";
import { pool } from "../config/db.js";
import { PurchaseSchema, type PurchaseType } from "../zod/purchaseSchema.js";

export const purchaseProduct = async (c: Context) => {
  const purchaseData: PurchaseType = await c.req.json();
  const { productId, quantity } = PurchaseSchema.parse(purchaseData);

  try {
    //Transaction starts
    await pool.query("BEGIN");

    //check if product is availble in db
    const productResult = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );
    if (productResult.rowCount === 0) {
      return c.json({ error: "Product not found" }, 404);
    }
    const product = productResult.rows[0];

    //sure that quantity is not zero, or users quantiy is more than actual quantity
    if (product.quantity < 0 || product.quantity < quantity) {
      return c.json({ error: "Product is out of stock" }, 400);
    }

    const totalPrice = quantity * product.amount;
    const user = await c.get("user");

    //if user place an order, then that amount gets substract from actual quantity
    await pool.query(
      "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
      [quantity, productId]
    );

    // query for add the order in db
    await pool.query(
      "INSERT INTO orders (userId, productId, quantity, totalPrice) VALUES ($1, $2, $3, $4) RETURNING *",
      [user.id, productId, quantity, totalPrice]
    );

    // if all queries are ok then  COMMIT is used to save changes and reflect them in the database
    await pool.query("COMMIT");

    // if any issue doesnt occurs then transaction successfull
    return c.json(
      {
        message: "Order placed successfully",
        totalPrice: `$${totalPrice}`,
      },
      200
    );
  } catch (error) {
    //if any error comes in queries, then ROLLBACK reverts all the changes
    await pool.query("ROLLBACK");
    return c.json({ error: `Error while purchase: ${error}` }, 500);
  }
};

//api for all orders if user type is admin
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

//api for getting users orders
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
