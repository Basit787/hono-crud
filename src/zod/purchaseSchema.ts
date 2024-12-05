import { z } from "zod";

const PurchaseSchema = z.object({
  productId: z.number().min(1, { message: "Add min 1 product to place order" }),
  quantity: z.number().min(1, { message: "Add min 1 quantity to place order" }),
});

export const PurchaseItem = z
  .array(PurchaseSchema)
  .min(1, { message: "Add atleast one product to purchase your order" });

export type PurchaseType = z.infer<typeof PurchaseItem>;
