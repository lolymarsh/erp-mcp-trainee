import { z } from "zod";

export const createProductSchema = z.object({
  categoryId: z.string().min(1).max(36),
  sku: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  unit: z.string().min(1).max(50).optional().default("piece"),
  costPrice: z.coerce.number().min(0).optional().default(0),
  sellPrice: z.coerce.number().min(0).optional().default(0),
  minStock: z.coerce.number().int().min(0).optional().default(0),
  currentStock: z.coerce.number().int().min(0).optional().default(0),
});

export const updateProductSchema = z.object({
  categoryId: z.string().min(1).max(36).optional(),
  sku: z.string().min(1).max(255).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  unit: z.string().min(1).max(50).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  sellPrice: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  version: z.number().int().min(1),
});

export const deleteProductSchema = z.object({
  version: z.number().int().min(1),
});

export const stockAdjustSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number().int(),
  referenceType: z.string().max(50).optional().nullable(),
  referenceId: z.string().max(36).optional().nullable(),
  note: z.string().optional().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;

export interface ProductResponse {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  costPrice: string;
  sellPrice: string;
  minStock: number;
  currentStock: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
}

export interface StockMovementResponse {
  id: string;
  productId: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
  note: string | null;
  createdAt: string;
}

export interface ProductWithMovementsResponse extends ProductResponse {
  movements: StockMovementResponse[];
}

export interface StockAdjustResponse {
  product: ProductResponse;
  movement: StockMovementResponse;
}
