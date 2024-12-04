import type { Context } from "hono";
import { pool } from "../config/db.js";
import { ProductSchema, type ProductType } from "../zod/productSchema.js";

export const addProduct = async (c: Context) => {
  const productData: ProductType = await c.req.json();
  const { name, amount, quantity } = ProductSchema.parse(productData);
  try {
    const result = await pool.query(
      "INSERT INTO products (name,amount,quantity) VALUES ($1,$2,$3) RETURNING *",
      [name, amount, quantity]
    );
    return c.json({ message: result.rows[0] }, 201);
  } catch (error) {
    return c.json({ error: "Internal Server Error" + error }, 500);
  }
};

export const getAllProducts = async (c: Context) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    return c.json({ message: result.rows }, 200);
  } catch (error) {
    return c.json({ error: error }, 500);
  }
};

export const getSingleProduct = async (c: Context) => {
  const [id] = c.req.param("id");
  try {
    const result = await pool.query("SELECT * FROM products WHERE id=$1", [id]);
    if (result.rowCount === 0) {
      return c.json({ message: "Product not found" }, 404);
    }
    return c.json({ message: result.rows[0] }, 200);
  } catch (error) {
    return c.json({ error: error }, 500);
  }
};

export const deleteProduct = async (c: Context) => {
  const [id] = c.req.param("id");
  try {
    const result = await pool.query("DELETE FROM products WHERE id=$1", [id]);
    if (result.rowCount === 0) {
      return c.json({ message: "Product not found" }, 404);
    }
    return c.json({ message: "User deleted successfully" }, 200);
  } catch (error) {
    return c.json({ error: error }, 500);
  }
};

export const updateProduct = async (c: Context) => {
  const [id] = c.req.param("id");
  const productData: ProductType = await c.req.json();
  const { name, amount, quantity } = ProductSchema.parse(productData);
  try {
    const result = await pool.query(
      "UPDATE products SET name=$1, amount=$2, quantity=$3 WHERE id = $4",
      [name, amount, quantity, id]
    );
    if (result.rowCount === 0) {
      return c.json({ message: "Product not found" }, 404);
    }
    return c.json({ message: "Product updated successfully" }, 201);
  } catch (error) {
    return c.json({ error: "Internal Server Error" + error }, 500);
  }
};
