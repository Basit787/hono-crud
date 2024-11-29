import type { Context } from "hono";
import { authUser } from "../models/authModel.js";
import { compareHashPassword, createToken } from "../utils/helpers.js";

export const loginUser = async (c: Context) => {
  const { email, password } = await c.req.json();
  const result = await authUser(email);

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
};
