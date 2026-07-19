export interface ProductEntity {
  id: string;
  categoryId: string;
  categoryName?: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  costPrice: string;
  sellPrice: string;
  minStock: number;
  currentStock: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CategoryEntity {
  id: string;
  name: string;
  description: string | null;
  version: number;
}

export interface StockMovementEntity {
  id: string;
  productId: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
  note: string | null;
  createdAt: Date;
}
