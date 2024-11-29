import bcrypt from "bcrypt";
import { config } from "dotenv";
import jwt from "jsonwebtoken";

config();

//hashed password section
export const HashedPassword = async (plainTextPassword: string) => {
  const saltRound = 10;
  return await bcrypt.hash(plainTextPassword, saltRound);
};

export const compareHashPassword = async (
  hashPassword: string,
  userPassword: string
) => {
  return await bcrypt.compare(hashPassword, userPassword);
};

//jwt token section
const SECRET_KEY = process.env.SECRET_KEY!;

export const createToken = (payload: object) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET_KEY);
};
