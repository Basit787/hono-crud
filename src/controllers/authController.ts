import type { Context } from "hono";
import { pool } from "../config/db.js";
import { compareHashPassword, createToken } from "../utils/helpers.js";
import { LoginSchema, type LoginType } from "../zod/loginSchema.js";

export const loginUser = async (c: Context) => {
  try {
    const userData: LoginType = await c.req.json();
    const { email, password } = LoginSchema.parse(userData);

    //check that data is present or not
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (result.rowCount === 0)
      return c.json({ error: `User not found with email : ${email}` }, 401);
    const user = result.rows[0];

    //verify the user password with database password
    const validPassword = await compareHashPassword(password, user.password);
    if (!validPassword) return c.json({ error: "Invalid Password" }, 401);

    //if all credential is ok then create the token
    const token = createToken({
      id: user.user_id,
      username: user.name,
      role: user.role,
    });

    if (!token) return c.json({ message: "Failed to create token" }, 400);

    return c.json({
      status: 200,
      message: `${user.name} logged In Successfully`,
      token,
    });
  } catch (error) {
    return c.json({ error: `Failed to login : ${error}` }, 500);
  }
};
