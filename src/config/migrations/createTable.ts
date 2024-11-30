import { pool } from "../db.js";

export const createTable = async () => {
  try {
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

    console.log("Table created successfully");
  } catch (error) {
    throw new Error(`Error while creating table : ${error}`);
  }
};
