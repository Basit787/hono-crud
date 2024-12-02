import type { Context } from "hono";
import { pool } from "../config/db.js";

export const purchaseProduct = async (c: Context) => {
  const { productId, quantity } = await c.req.json();

  try {
    const user = await c.get("user");
    if (!user) {
      return c.json({ error: "User not login" }, 401);
    }

    const productResult = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );
    if (productResult.rowCount === 0) {
      return c.json({ error: "Product not found" }, 404);
    }
    const product = productResult.rows[0];

    if (product.quantity < 0)
      return c.json({ message: "Product is out of stock" }, 400);
    if (product.quantity < quantity)
      return c.json({ error: "Product is out of stock" }, 400);
    // the above code gets break after using (product.quantity < 0 && product.quantity < quantity) return c.json({ message: "Product is out of stock" }, 400);

    const totalPrice = quantity * product.amount.split("$")[1];

    //update the qunatity by substracting user order
    await pool.query(
      "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
      [quantity, productId]
    );

    await pool.query(
      "INSERT INTO orders (userId, productId, quantity, totalPrice) VALUES ($1, $2, $3, $4) RETURNING *",
      [user.id, productId, quantity, totalPrice]
    );

    return c.json({
      message: "Order placed successfully",
      totalPrice: `$${totalPrice}`,
    });
  } catch (error) {
    return c.json({ error: `Error while purchase: ${error}` }, 400);
  }
};
