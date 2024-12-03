import type { Context } from "hono";
import { pool } from "../config/db.js";
import { compareHashPassword, createToken } from "../utils/helpers.js";

export const loginUser = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    //check that data is present or not
    if (result.rowCount === 0) return c.json({ error: "Invalid Email" }, 401);
    const user = result.rows[0];

    //verify the user password with database password
    const validPassword = await compareHashPassword(password, user.password);
    if (!validPassword) return c.json({ error: "Invalid Password" }, 401);

    //if all credential is ok then create the token
    const token = createToken({
      id: user.id,
      username: user.username,
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
