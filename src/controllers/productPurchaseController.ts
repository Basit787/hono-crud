import type { Context } from "hono";
import { pool } from "../config/db.js";
import { PurchaseItem, type PurchaseType } from "../zod/purchaseSchema.js";
import { error } from "console";

export const purchaseProduct = async (c: Context) => {
  const purchaseData: PurchaseType = await c.req.json();
  const items = PurchaseItem.parse(purchaseData);

  try {
    await pool.query("BEGIN");
    const user = c.get("user");
    let totalPrice = 0;

    for (const item of items) {
      //iterate all the item to check either item is present or not
      const productData = await pool.query(
        `SELECT * FROM products WHERE product_id = $1`,
        [item.productId]
      );

      //throw error if not product found
      if (productData.rowCount === 0) {
        await pool.query("ROLLBACK");
        return c.json({ error: `Product ${item.productId} not found` }, 500);
      }

      const product = productData.rows[0];

      const productQuantity = Number(product.quantity);
      if (productQuantity < item.quantity || productQuantity <= 0) {
        return c.json(
          {
            error: `Product out of stock ${item.productId}`,
          },
          400
        );
      }

      totalPrice += Number(product.amount * item.quantity);

      await pool.query(
        "UPDATE products SET quantity = quantity - $1 WHERE product_id = $2",
        [item.quantity, product.product_id]
      );
    }

    //add the userid and amount to create the order
    const createOrder = await pool.query(
      "INSERT INTO orders (user_id,totalPrice) VALUES($1,$2) RETURNING order_id",
      [user.id, totalPrice]
    );

    const createOrderId = createOrder.rows[0].order_id;

    //iterate items form array
    for (const item of items) {
      await pool.query(
        "INSERT INTO orders_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [createOrderId, item.productId, item.quantity, totalPrice]
      );
    }

    if (createOrder.rowCount === 0) {
      return c.json({ error: "Failed to place order" });
    }

    await pool.query("COMMIT");
    return c.json({
      message: "Order placed successfully",
      totalPrice,
      createOrderId,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    return c.json({ message: "Failed to place order", error: error }, 500);
  }
};

//api for getting users orders
export const getUserOrders = async (c: Context) => {
  const { id } = c.get("user");
  try {
    const ordersResult = await pool.query(
      `
      SELECT 
        o.order_id,
        o.user_id,
        o.totalprice,
        o.created_at
      FROM orders o
      WHERE o.user_id = $1
    `,
      [id]
    );

    if (ordersResult.rowCount === 0)
      return c.json({ error: "Order Not Found" }, 404);

    const orderItems = await pool.query(
      `
        SELECT 
          oi.order_id,
          oi.quantity,
          oi.price,
          p.product_id,
          p.name as product_name,
          p.amount as product_price
        FROM orders_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ANY($1)
      `,
      [ordersResult.rows.map((order) => order.order_id)]
    );

    console.log("absvfd", orderItems);

    const ordersWithItems = ordersResult.rows.map((order) => ({
      ...order,
      items: orderItems.rows.filter((item) => item.order_id === order.order_id),
    }));

    return c.json({ orders: ordersWithItems }, 200);
  } catch (error) {
    return c.json(
      { error: "Error while fetching orders", details: error },
      500
    );
  }
};

//api for all orders if user type is admin
export const getAdminOrders = async (c: Context) => {
  try {
    const ordersResult = await pool.query(
      `
      SELECT 
        o.order_id,
        o.user_id,
        o.totalprice,
        o.created_at,
        u.name AS user_name,
        u.email AS user_email,
      FROM orders o
      JOIN users u ON o.user_id = u.user_id;
      `
    );

    if (ordersResult.rowCount === 0) {
      return c.json({ error: "No orders found" }, 200);
    }

    const orderIds = ordersResult.rows.map((order) => order.order_id);

    const orderItems = await pool.query(
      `
      SELECT 
        oi.order_id,
        oi.quantity,
        oi.price,
        p.product_id,
        p.name AS product_name,
        p.amount AS product_price
      FROM orders_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ANY($1)
      `,
      [orderIds]
    );

    const ordersWithItems = ordersResult.rows.map((order) => ({
      ...order,
      items: orderItems.rows.filter((item) => item.order_id === order.order_id),
    }));

    return c.json({ orders: ordersWithItems }, 200);
  } catch (error) {
    return c.json(
      { error: "Error while fetching orders", details: error },
      500
    );
  }
};
