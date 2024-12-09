import type { Context } from "hono";
import { pool } from "../config/db.js";
import type { PurchaseType } from "../zod/purchaseSchema.js";

export const purchaseProduct = async (c: Context) => {
  const items: PurchaseType = await c.req.json();

  try {
    await pool.query("BEGIN");
    const user = c.get("user");

    const { productIds, userQuantity } = items.reduce<{
      productIds: number[];
      userQuantity: number[];
    }>(
      (acc, item) => {
        acc.productIds.push(item.productId);
        acc.userQuantity.push(item.quantity);
        return acc;
      },
      { productIds: [], userQuantity: [] }
    );

    const products = await pool.query(
      `SELECT * FROM products WHERE product_id = ANY($1)`,
      [productIds]
    );

    const productData = products.rows;

    //get the product_ids for each item and get the price for each item based on quantity
    const { product_id, productPrice, actualQuantity, totalPrice } =
      productData.reduce(
        (acc, item, index) => {
          acc.product_id.push(item.product_id);
          acc.productPrice.push(Number(item.amount) * userQuantity[index]);
          acc.actualQuantity.push(Number(item.quantity));
          acc.totalPrice += Number(item.amount * userQuantity[index]);
          return acc;
        },
        { product_id: [], productPrice: [], actualQuantity: [], totalPrice: 0 }
      );

    //chech either product is present or not in db
    if (productData.length !== productIds.length) {
      await pool.query("ROLLBACK");
      return c.json({ error: "Product not found" }, 400);
    }

    //Check either purchase quantity is less or equal than actual quantity
    const availableQuantity = !userQuantity.every(
      (value: number, index: number) => value <= actualQuantity[index]
    );

    const outOfStock =
      actualQuantity.filter((item: number) => item !== 0).length !==
      userQuantity.length;

    if (availableQuantity || outOfStock) {
      await pool.query("ROLLBACK");
      return c.json({ message: "Product Out of stock" }, 409); // 409 indicates the request conflicts with the current state of the resource.
    }

    //update the quantity in products
    const updateProduct = await pool.query(
      `
    UPDATE products
    SET quantity = quantity - CASE product_id
      ${productIds
        .map((id, index) => `WHEN '${id}' THEN ${userQuantity[index]}`)
        .join(" ")}
    END
    WHERE product_id IN (${productIds.map((id) => `'${id}'`).join(", ")});
  `
    );
    if (updateProduct.rowCount === 0)
      return c.json({ error: "Error while updating the products" }, 400);

    //placeorder if all above data is ok
    const placeOrder = await pool.query(
      "INSERT INTO orders (user_id,totalPrice) VALUES ($1,$2) RETURNING *",
      [user.id, totalPrice]
    );

    if (!placeOrder) return c.json({ error: "Failed to place order" }, 400);

    const orderId = placeOrder.rows[0].order_id;

    // now add the items in that particular order
    const insertItems = await pool.query(
      `INSERT INTO orders_items(order_id, product_id, quantity, price) 
   SELECT $1, UNNEST($2::integer[]), UNNEST($3::integer[]), UNNEST($4::numeric[])
   RETURNING *`,
      [orderId, product_id, userQuantity, productPrice]
    );

    if (insertItems.rowCount === 0) {
      await pool.query("ROLLBACK");
      return c.json({ error: "Failed to insert the items" }, 400);
    }
    // await pool.query("COMMIT");
    return c.json(
      { message: "Order place successfully", orderId, totalPrice },
      201
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    return c.json({ message: "Failed to place order", error: error }, 400);
  }
};

//api for getting users orders
export const userOrdersController = async (c: Context) => {
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
      return c.json({ error: "Failed to get items" }, 400);

    const orderId = ordersResult.rows.map(
      (order: { order_id: number }) => order.order_id
    );

    const orderItems = await pool.query(
      `
        SELECT 
          oi.order_id,
          oi.quantity,
          oi.price,
          p.product_id,
          p.name as product_name,
        FROM orders_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ANY($1)
      `,
      [orderId]
    );

    if (orderItems.rowCount === 0)
      return c.json({ error: "Failed to get items" }, 400);

    const ordersWithItems = ordersResult.rows.map((order) => ({
      ...order,
      items: orderItems.rows.filter(
        (item: { order_id: number }) => item.order_id === order.order_id
      ),
    }));

    return c.json({ orders: ordersWithItems }, 200);
  } catch (error) {
    return c.json(
      { error: "Error while fetching orders", details: error },
      400
    );
  }
};

//api for all orders if user type is admin
export const adminOrdersController = async (c: Context) => {
  try {
    const ordersResult = await pool.query(
      `
      SELECT 
        o.order_id,
        o.user_id,
        o.totalprice,
        o.created_at,
        u.name AS user_name,
        u.email AS user_email
        
      FROM orders o
      JOIN users u ON o.user_id = u.user_id;
      `
    );

    if (ordersResult.rowCount === 0) {
      return c.json({ error: "No orders found" }, 200);
    }

    const orderId = ordersResult.rows.map(
      (order: { order_id: number }) => order.order_id
    );

    const orderItems = await pool.query(
      `
      SELECT 
        oi.order_id,
        oi.quantity,
        oi.price,
        p.product_id,
        p.name AS product_name,
      FROM orders_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ANY($1)
      `,
      [orderId]
    );

    const ordersWithItems = ordersResult.rows.map((order) => ({
      ...order,
      items: orderItems.rows.filter(
        (item: { order_id: number }) => item.order_id === order.order_id
      ),
    }));

    return c.json({ orders: ordersWithItems }, 200);
  } catch (error) {
    return c.json(
      { error: "Error while fetching orders", details: error },
      400
    );
  }
};
