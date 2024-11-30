import pg from "pg";
import { config } from "dotenv";

config();
const { Pool } = pg;

export const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.HOST,
  port: Number(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DB,
});

try {
  await pool.connect();
  console.log("Connected to database");
} catch (error) {
  console.log("failed to connect db", error);
}
