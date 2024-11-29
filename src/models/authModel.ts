import { query } from "../config/db.js";

export const authUser = async (email: string) => {
  return await query("SELECT * FROM users WHERE email=$1", [email]);
};
