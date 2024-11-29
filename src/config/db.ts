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
  await pool.query(`
 CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age SMALLINT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);`);
} catch (error) {
  console.log("failed to connect db", error);
}

export const query = (text: string, params?: string[]) => {
  return pool.query(text, params);
};
