import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid Email format" }),
  password: z.string().min(8, { message: "Password must be min 8 chars" }),
});

export type LoginType = z.infer<typeof LoginSchema>;
