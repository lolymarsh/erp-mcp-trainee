import {
  eq,
  and,
  like,
  gt,
  gte,
  lt,
  lte,
  ne,
  isNull,
  count,
  inArray,
  asc,
  desc,
  sql,
} from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { SQL, Column } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { products, categories, stockMovements } from "../../config/schema";
import type {
  ProductEntity,
  CategoryEntity,
  StockMovementEntity,
} from "./entity";
import type { FilterRequestInput } from "../../shared/pagination/schema";

export interface StockAdjustData {
  productId: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
  note: string | null;
}

export interface StockAdjustResult {
  product: ProductEntity;
  movement: StockMovementEntity;
}

export interface IInventoryRepository {
  findFiltered(
    input: FilterRequestInput,
  ): Promise<{ data: ProductEntity[]; total: number }>;
  findById(id: string): Promise<ProductEntity | null>;
  findByIdWithMovements(
    id: string,
  ): Promise<{ product: ProductEntity; movements: StockMovementEntity[] } | null>;
  findBySku(sku: string): Promise<ProductEntity | null>;
  findAllCategories(): Promise<CategoryEntity[]>;
  create(data: {
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
  }): Promise<ProductEntity>;
  update(
    id: string,
    data: Partial<{
      categoryId: string;
      sku: string;
      name: string;
      description: string | null;
      unit: string;
      costPrice: string;
      sellPrice: string;
      minStock: number;
    }>,
    version: number,
  ): Promise<ProductEntity | null>;
  softDelete(id: string, version: number): Promise<boolean>;
  adjustStock(input: StockAdjustData): Promise<StockAdjustResult>;
}

export class InventoryRepository implements IInventoryRepository {
  constructor(private db: MySql2Database) {}

  async findFiltered(
    input: FilterRequestInput,
  ): Promise<{ data: ProductEntity[]; total: number }> {
    const conditions = this.buildFilterConditions(input);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(products)
      .where(whereClause);

    const total = totalResult[0]?.count ?? 0;

    const orderClause = this.resolveSort(input.sortName, input.sortBy);
    const offset = (input.page - 1) * input.pageSize;

    const rows = await this.db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(input.pageSize)
      .offset(offset);

    return { data: rows, total };
  }

  private buildFilterConditions(input: FilterRequestInput): SQL[] {
    const conditions: SQL[] = [isNull(products.deletedAt)];

    if (!input.filters) return conditions;

    for (const f of input.filters) {
      const col = this.resolveColumn(f.field);
      if (!col) continue;

      const value = String(f.value);
      switch (f.operator) {
        case "eq":
          conditions.push(eq(col, value));
          break;
        case "neq":
          conditions.push(ne(col, value));
          break;
        case "contains":
          conditions.push(like(col, `%${value}%`));
          break;
        case "gt":
          conditions.push(gt(col, value));
          break;
        case "gte":
          conditions.push(gte(col, value));
          break;
        case "lt":
          conditions.push(lt(col, value));
          break;
        case "lte":
          conditions.push(lte(col, value));
          break;
        case "in": {
          const values = Array.isArray(f.value) ? f.value : [f.value];
          conditions.push(inArray(col, values as string[]));
          break;
        }
      }
    }

    return conditions;
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const result = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1);

    if (result.length === 0) return null;
    return result[0];
  }

  async findByIdWithMovements(
    id: string,
  ): Promise<{ product: ProductEntity; movements: StockMovementEntity[] } | null> {
    const productRow = await this.findById(id);
    if (!productRow) return null;

    const movementRows = await this.db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, id))
      .orderBy(desc(stockMovements.createdAt));

    return {
      product: productRow,
      movements: movementRows as unknown as StockMovementEntity[],
    };
  }

  async findBySku(sku: string): Promise<ProductEntity | null> {
    const result = await this.db
      .select()
      .from(products)
      .where(and(eq(products.sku, sku), isNull(products.deletedAt)))
      .limit(1);

    if (result.length === 0) return null;
    return result[0];
  }

  async findAllCategories(): Promise<CategoryEntity[]> {
    const result = await this.db.select().from(categories);
    return result;
  }

  async create(data: {
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
  }): Promise<ProductEntity> {
    await this.db.insert(products).values(data);
    const created = await this.db
      .select()
      .from(products)
      .where(eq(products.id, data.id))
      .limit(1);

    return created[0];
  }

  async update(
    id: string,
    data: Partial<{
      categoryId: string;
      sku: string;
      name: string;
      description: string | null;
      unit: string;
      costPrice: string;
      sellPrice: string;
      minStock: number;
    }>,
    version: number,
  ): Promise<ProductEntity | null> {
    const result = await this.db
      .update(products)
      .set({ ...data, version: version + 1, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.version, version)));

    if (result[0].affectedRows === 0) return null;

    const updated = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return updated[0];
  }

  async softDelete(id: string, version: number): Promise<boolean> {
    const result = await this.db
      .update(products)
      .set({
        deletedAt: new Date(),
        version: version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, id), eq(products.version, version)));

    return result[0].affectedRows > 0;
  }

  async adjustStock(input: StockAdjustData): Promise<StockAdjustResult> {
    return this.db.transaction(async (tx) => {
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .for("update");

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      let newStock: number;
      if (input.type === "IN") {
        newStock = product.currentStock + input.quantity;
      } else if (input.type === "OUT") {
        newStock = product.currentStock - input.quantity;
      } else {
        newStock = input.quantity;
      }

      if (newStock < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx
        .update(products)
        .set({
          currentStock: sql`CAST(${newStock} AS SIGNED)`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, input.productId));

      const movementId = uuidv4();
      await tx.insert(stockMovements).values({
        id: movementId,
        productId: input.productId,
        type: input.type,
        quantity: input.quantity,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        createdBy: input.createdBy,
        note: input.note,
        createdAt: new Date(),
      });

      const [updated] = await tx
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);

      return {
        product: updated,
        movement: {
          id: movementId,
          productId: input.productId,
          type: input.type,
          quantity: input.quantity,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          createdBy: input.createdBy,
          note: input.note,
          createdAt: new Date(),
        },
      };
    });
  }

  private resolveColumn(field: string): Column | null {
    switch (field) {
      case "sku":
        return products.sku;
      case "name":
        return products.name;
      case "categoryId":
        return products.categoryId;
      case "unit":
        return products.unit;
      default:
        return null;
    }
  }

  private resolveSort(
    sortName: string | undefined,
    sortBy: "asc" | "desc",
  ): SQL {
    const sortFn = sortBy === "asc" ? asc : desc;
    switch (sortName) {
      case "sku":
        return sortFn(products.sku);
      case "name":
        return sortFn(products.name);
      case "sellPrice":
        return sortFn(products.sellPrice);
      case "currentStock":
        return sortFn(products.currentStock);
      case "updatedAt":
        return sortFn(products.updatedAt);
      default:
        return sortFn(products.createdAt);
    }
  }
}
