import type { Context } from "hono";
import * as userModel from "../models/userModel.js";
import { HashedPassword } from "../utils/helpers.js";

//get all users
export const getAllUsers = async (c: Context) => {
  try {
    const result = await userModel.getAllUsers();
    return c.json(result.rows, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};

//create user
export const registerUser = async (c: Context) => {
  const { password, role = "user", ...user } = await c.req.json();
  const hashedPassword = await HashedPassword(password);
  try {
    const result = await userModel.registerUser({
      ...user,
      password: hashedPassword,
      role: role,
    });
    return c.json(result.rows[0], 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};

//get single user
export const getSingleUser = async (c: Context) => {
  const id = c.req.param("id");
  try {
    const result = await userModel.getSingleUser(id);
    if (result.rowCount === 0)
      return c.json({ message: "User not found" }, 404);
    return c.json(result.rows[0]);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};

//delete user
export const deleteUser = async (c: Context) => {
  const id = c.req.param("id");
  try {
    const result = await userModel.deleteUser(id);
    if (result.rowCount === 0)
      return c.json({ messgae: "User Not found" }, 404);

    return c.json({ message: "User deleted successsfully" }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};

//update user
export const updateUser = async (c: Context) => {
  const id = c.req.param("id");
  const { password, ...updatedData } = await c.req.json();
  const hashedPassword = await HashedPassword(password);
  try {
    const result = await userModel.updateUser(
      { ...updatedData, password: hashedPassword },
      id
    );
    if (result.rowCount === 0)
      return c.json({ message: "User not found" }, 404);
    return c.json(
      {
        message: "User Updated Successfully",
        data: { ...updatedData, password: hashedPassword },
      },
      201
    );
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
