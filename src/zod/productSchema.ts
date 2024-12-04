import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string(),
  amount: z.number(),
  quantity: z.number().min(1, { message: "min 1 quantity is required" }),
});

export type ProductType = z.infer<typeof ProductSchema>;
