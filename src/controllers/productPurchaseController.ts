import type { Context } from "hono";
import { pool } from "../config/db.js";
import type { PurchaseType } from "../zod/purchaseSchema.js";

export const purchaseProduct = async (c: Context) => {
  const items: PurchaseType = await c.req.json();

  try {
    await pool.query("BEGIN");
    const user = c.get("user");

    const productIds = items.map((item) => item.productId);
    const userQuantity = items.map((item) => item.quantity);

    const products = await pool.query(
      `SELECT * FROM products WHERE product_id = ANY($1)`,
      [productIds]
    );
    const productData = products.rows;
    const actualQuantity = productData.map((i) => Number(i.quantity));

    //chech either product is present or not in db
    if (productData.length !== productIds.length) {
      await pool.query("ROLLBACK");
      return c.json({ error: "Product not found" }, 400);
    }

    //Check either purchase quantity is less or equal than actual quantity
    const availableQuantity = !userQuantity.every(
      (value, index) => value <= actualQuantity[index]
    );

    //check either the product quantity is zero or not
    const outOfStock =
      actualQuantity.filter((item) => item !== 0).length !==
      userQuantity.length;

    if (availableQuantity || outOfStock) {
      await pool.query("ROLLBACK");
      return c.json({ message: "Product Out of stock" }, 409); // 409 indicates the request conflicts with the current state of the resource.
    }

    //get total price
    const totalPrice = productData
      .map((num, index) => Number(num.amount) * userQuantity[index])
      .reduce((acc, em) => acc + em);

    //!update the quantity in products
    const updateQuantity = userQuantity.map(async (item, index) => {
      await pool.query(
        "UPDATE products SET quantity = quantity- $1 WHERE product_id = $2",
        [item, productIds[index]]
      );
    });

    console.log("fvh", updateQuantity);

    //placeorder if all above data is ok
    const placeOrder = await pool.query(
      "INSERT INTO orders (user_id,totalPrice) VALUES ($1,$2) RETURNING *",
      [user.id, totalPrice]
    );

    if (!placeOrder) return c.json({ error: "Failed to place order" }, 400);

    const orderId = placeOrder.rows[0].order_id;

    // await pool.query("COMMIT");
    return c.json({ message: "Order place successfully", orderId, totalPrice });
  } catch (error) {
    await pool.query("ROLLBACK");
    return c.json({ message: "Failed to place order", error: error }, 400);
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
      [ordersResult.rows.map((order) => order.order_id)]
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
