import { pool } from "../db.js";

const createTables = async () => {
  try {
    // users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age INT NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );`);

    //product table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products(
        product_id SERIAL PRIMARY KEY,
        name varchar(255) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        quantity NUMERIC(10,2) NOT NULL CHECK (quantity >= 0),
        created_at TIMESTAMP DEFAULT NOW()
      )`);

    //orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id),
        totalPrice NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`);

    //orders-items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders_items(
        item_id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(order_id),
        product_id INT REFERENCES products(product_id),
        quantity NUMERIC(10,2) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

    console.log("Tables created successfully");
  } catch (error) {
    throw new Error(`Error while creating users table : ${error}`);
  }
};

createTables();
