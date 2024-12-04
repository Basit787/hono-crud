import type { Context } from "hono";
import { pool } from "../config/db.js";
import { HashedPassword } from "../utils/helpers.js";
import { UserSchema, type UserType } from "../zod/userSchema.js";

//get all users
export const getAllUsers = async (c: Context) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    return c.json(result.rows, 200);
  } catch (error) {
    return c.json({ error: error }, 500);
  }
};

//create user
export const registerUser = async (c: Context) => {
  const userData: UserType = await c.req.json();
  const { password, role, ...user } = UserSchema.parse(userData);
  const hashedPassword = await HashedPassword(password);

  try {
    const result = await pool.query(
      `INSERT INTO users (name, age, email, password,role)
    VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user.name, user.age, user.email, hashedPassword, role]
    );
    return c.json(result.rows[0], 201);
  } catch (error) {
    return c.json({ error: "Internal Server Error" + error }, 500);
  }
};

//get single user
export const getSingleUser = async (c: Context) => {
  const id = c.req.param("id");
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rowCount === 0)
      return c.json({ message: "User not found" }, 404);
    return c.json(result.rows[0]);
  } catch (error) {
    return c.json({ error: error }, 500);
  }
};

//delete user
export const deleteUser = async (c: Context) => {
  const id = c.req.param("id");
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    if (result.rowCount === 0)
      return c.json({ messgae: "User Not found" }, 404);
    return c.json({ message: "User deleted successsfully" }, 200);
  } catch (error) {
    return c.json({ error: error }, 500);
  }
};

//update user
export const updateUser = async (c: Context) => {
  const id = c.req.param("id");
  const userData: UserType = await c.req.json();
  const { password, ...updatedData } = UserSchema.parse(userData);
  const hashedPassword = await HashedPassword(password);

  try {
    const result = await pool.query(
      `UPDATE users
    SET name=$1, email=$2, age=$3, password=$4, role=$5
    WHERE id=$6`,
      [
        updatedData.name,
        updatedData.email,
        updatedData.age,
        hashedPassword,
        updatedData.role,
        id,
      ]
    );
    if (result.rowCount === 0)
      return c.json({ message: "User not found" }, 404);
    return c.json({ message: "User Updated Successfully" }, 201);
  } catch (error) {
    return c.json({ error: "Internal Server Error" + error }, 500);
  }
};
