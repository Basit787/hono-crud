import bcrypt from "bcrypt";
import { config } from "dotenv";
import jwt from "jsonwebtoken";

config();

//hashed password section
export const HashedPassword = async (plainTextPassword: string) => {
  try {
    const saltRound = 10;
    return await bcrypt.hash(plainTextPassword, saltRound);
  } catch (error) {
    throw new Error(`Error while creating hash password : ${error}`);
  }
};

export const compareHashPassword = async (
  hashPassword: string,
  userPassword: string
) => {
  try {
    return await bcrypt.compare(hashPassword, userPassword);
  } catch (error) {
    throw new Error(`Error while comparing password : ${error}`);
  }
};

//jwt token section
const SECRET_KEY = process.env.SECRET_KEY!;

export const createToken = (payload: object) => {
  try {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
  } catch (error) {
    throw new Error(`Error while creating token: ${error}`);
  }
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    throw new Error(`Error while verifying token: ${error}`);
  }
};
