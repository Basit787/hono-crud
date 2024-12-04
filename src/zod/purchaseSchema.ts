import { z } from "zod";

export const PurchaseSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1, { message: "Add min 1 quantity to place order" }),
});

export type PurchaseType = z.infer<typeof PurchaseSchema>;
