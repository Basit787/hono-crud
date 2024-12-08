import type { Context } from "hono";
import { pool } from "../config/db.js";
import type { PurchaseType } from "../zod/purchaseSchema.js";

interface Item {
  item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: Date;
}

export const purchaseProduct = async (c: Context) => {
  const items: PurchaseType = await c.req.json();

  try {
    await pool.query("BEGIN");
    const user = c.get("user");

    const productIds = items.map(
      (item: { productId: number }) => item.productId
    );
    const userQuantity = items.map(
      (item: { quantity: number }) => item.quantity
    );

    const products = await pool.query(
      `SELECT * FROM products WHERE product_id = ANY($1)`,
      [productIds]
    );

    const productData = products.rows;
    const actualQuantity = productData.map((item: { quantity: number }) =>
      Number(item.quantity)
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

    //check either the product quantity is zero or not
    const outOfStock =
      actualQuantity.filter((item: number) => item !== 0).length !==
      userQuantity.length;

    if (availableQuantity || outOfStock) {
      await pool.query("ROLLBACK");
      return c.json({ message: "Product Out of stock" }, 409); // 409 indicates the request conflicts with the current state of the resource.
    }

    //get total price
    const totalPrice = productData
      .map(
        (item: { amount: number }, index: number) =>
          item.amount * userQuantity[index]
      )
      .reduce((acc: number, em: number) => acc + em);

    //update the quantity in products
    for (let i: number = 0; i < userQuantity.length; i++) {
      try {
        await pool.query(
          "UPDATE products SET quantity = quantity - $1 WHERE product_id = $2",
          [userQuantity[i], productIds[i]]
        );
      } catch (error) {
        await pool.query("ROLLBACK");
        return c.json({ error: error }, 400);
      }
    }

    //placeorder if all above data is ok
    const placeOrder = await pool.query(
      "INSERT INTO orders (user_id,totalPrice) VALUES ($1,$2) RETURNING *",
      [user.id, totalPrice]
    );

    if (!placeOrder) return c.json({ error: "Failed to place order" }, 400);

    const orderId = placeOrder.rows[0].order_id;

    //get the product_ids for each item
    const product_id = productData.map(
      (item: { product_id: number }) => item.product_id
    );

    //get the price for each item based on quantity
    const productPrice = productData.map((item: { amount: number }): number =>
      Number(item.amount)
    );

    const eachProductPrice = productPrice.map(
      (item: number, index: number) => item * userQuantity[index]
    );

    // now add the items in that particular order
    const insertItems = await pool.query(
      `INSERT INTO orders_items(order_id, product_id, quantity, price) 
   SELECT $1, UNNEST($2::integer[]), UNNEST($3::integer[]), UNNEST($4::numeric[])
   RETURNING *`,
      [orderId, product_id, userQuantity, eachProductPrice]
    );

    if (insertItems.rowCount === 0) {
      await pool.query("ROLLBACK");
      return c.json({ error: "Failed to insert the items" }, 400);
    }
    await pool.query("COMMIT");
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
          p.amount as product_price
        FROM orders_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id IN (SELECT unnest($1::integer[]))
      `,
      [orderId]
    );

    if (orderItems.rowCount === 0)
      return c.json({ error: "Failed to get items" }, 400);

    const ordersWithItems = ordersResult.rows.map((order: Item) => ({
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
        p.amount AS product_price
      FROM orders_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id IN (SELECT unnest($1::integer[]))
      `,
      [orderId]
    );

    const ordersWithItems = ordersResult.rows.map((order: Item) => ({
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
