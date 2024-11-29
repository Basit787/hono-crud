import { query } from "../config/db.js";

interface User {
  name: string;
  age: string;
  email: string;
  password: string;
  role: string;
}

//query for get all users
export const getAllUsers = async () => {
  return await query("SELECT * FROM users");
};

//query for create user
export const registerUser = async (user: User) => {
  return await query(
    `INSERT INTO users (name, age, email, password,role)
    VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [user.name, user.age, user.email, user.password, user.role]
  );
};

//query for get single user
export const getSingleUser = async (id: string) => {
  return await query("SELECT * FROM users WHERE id = $1", [id]);
};

//query for delete user
export const deleteUser = async (id: string) => {
  return await query("DELETE FROM users WHERE id = $1", [id]);
};

// query for updating the user
export const updateUser = async (user: User, id: string) => {
  return await query(
    `UPDATE users
    SET name=$1, email=$2, age=$3, password=$4
    WHERE id=$5`,
    [user.name, user.email, user.age, user.password, id]
  );
};
