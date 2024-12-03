import { pool } from "../db.js";

export const createTables = async () => {
  try {
    //users table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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
            id SERIAL PRIMARY KEY,
            name varchar(255) NOT NULL,
            amount NUMERIC NOT NULL,
            quantity INT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
            )
            `);

    //orders table
    await pool.query(`
        CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id),
        productId INTEGER REFERENCES products(id),
        quantity INTEGER,
        totalPrice DECIMAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
        `);

    console.log("Tables created successfully");
    // await pool.query("DROP TABLE products, orders");
  } catch (error) {
    throw new Error(`Error while creating users table : ${error}`);
  }
};
