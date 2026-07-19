import { v4 as uuidv4 } from "uuid";
import type Redis from "ioredis";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { IInventoryRepository } from "./repo";
import type { ProductEntity, StockMovementEntity } from "./entity";
import type {
  CreateProductInput,
  UpdateProductInput,
  DeleteProductInput,
  StockAdjustInput,
  ProductResponse,
  ProductWithMovementsResponse,
  StockMovementResponse,
  StockAdjustResponse,
  CategoryResponse,
  CreateCategoryInput,
  UpdateCategoryInput,
  DeleteCategoryInput,
} from "./schema";
import type { FilterRequestInput } from "../../shared/pagination/schema";
import type { PaginationResponse } from "../../shared/response/handler";
import { calculatePagination } from "../../shared/response/handler";
import {
  NotFoundError,
  ConflictError,
  AppError,
  BadRequestError,
} from "../../shared/errors/AppError";
import type { IAuditLogService } from "../audit/service";
import type { AuditMeta } from "../../shared/middleware/auditMeta";

export interface IInventoryService {
  filter(
    input: FilterRequestInput,
  ): Promise<{ data: ProductResponse[]; pagination: PaginationResponse }>;
  getById(id: string): Promise<ProductWithMovementsResponse>;
  create(
    input: CreateProductInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<ProductResponse>;
  update(
    id: string,
    input: UpdateProductInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<ProductResponse>;
  softDelete(
    id: string,
    input: DeleteProductInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<void>;
  adjustStock(
    productId: string,
    input: StockAdjustInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<StockAdjustResponse>;
  filterCategories(input: FilterRequestInput): Promise<{ data: CategoryResponse[]; pagination: PaginationResponse }>;
  listCategories(): Promise<CategoryResponse[]>;
  createCategory(input: CreateCategoryInput, userId: string, meta?: AuditMeta): Promise<CategoryResponse>;
  updateCategory(id: string, input: UpdateCategoryInput, userId: string, meta?: AuditMeta): Promise<CategoryResponse>;
  deleteCategory(id: string, input: DeleteCategoryInput, userId: string, meta?: AuditMeta): Promise<void>;
}

const DASHBOARD_CACHE_KEY = "dashboard:summary";

export class InventoryService implements IInventoryService {
  constructor(
    private repo: IInventoryRepository,
    private db: MySql2Database,
    private redis: Redis,
    private auditService: IAuditLogService,
  ) {}

  async filter(
    input: FilterRequestInput,
  ): Promise<{ data: ProductResponse[]; pagination: PaginationResponse }> {
    const result = await this.repo.findFiltered(input);
    const pagination = calculatePagination(
      input.page,
      input.pageSize,
      result.total,
    );

    return {
      data: result.data.map((p) => this.toProductResponse(p)),
      pagination,
    };
  }

  async getById(id: string): Promise<ProductWithMovementsResponse> {
    const result = await this.repo.findByIdWithMovements(id);
    if (!result) throw new NotFoundError("Product not found");

    return {
      ...this.toProductResponse(result.product),
      movements: result.movements.map((m) => this.toMovementResponse(m)),
    };
  }

  async create(
    input: CreateProductInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<ProductResponse> {
    const existing = await this.repo.findBySku(input.sku);
    if (existing) throw new AppError(409, "SKU already exists");

    const entity = await this.repo.create({
      id: uuidv4(),
      categoryId: input.categoryId,
      sku: input.sku,
      name: input.name,
      description: input.description ?? null,
      unit: input.unit ?? "piece",
      costPrice: String(input.costPrice),
      sellPrice: String(input.sellPrice),
      minStock: input.minStock,
      currentStock: input.currentStock,
      version: 1,
    });

    this.auditService.insertAuditLog(
      "CREATE",
      "products",
      entity.id,
      userId,
      null,
      entity,
      meta,
    );

    return this.toProductResponse(entity);
  }

  async update(
    id: string,
    input: UpdateProductInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<ProductResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Product not found");

    const { version, ...fields } = input;

    if (typeof fields.sku === "string") {
      const existingSku = await this.repo.findBySku(fields.sku);
      if (existingSku && existingSku.id !== id) {
        throw new AppError(409, "SKU already exists");
      }
    }

    const updateData: Record<string, unknown> = { ...fields };
    if (typeof fields.sellPrice === "number") {
      updateData.sellPrice = String(fields.sellPrice);
    }
    if (typeof fields.costPrice === "number") {
      updateData.costPrice = String(fields.costPrice);
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const updated = await this.repo.update(id, updateData as any, version);
    if (!updated) throw new ConflictError("Version mismatch");

    this.auditService.insertAuditLog(
      "UPDATE",
      "products",
      id,
      userId,
      existing,
      updated,
      meta,
    );

    return this.toProductResponse(updated);
  }

  async softDelete(
    id: string,
    input: DeleteProductInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<void> {
    const before = await this.repo.findById(id);
    if (!before) throw new NotFoundError("Product not found");

    const deleted = await this.repo.softDelete(id, input.version);
    if (!deleted) throw new ConflictError("Version mismatch or product not found");

    const after = await this.repo.findById(id);
    this.auditService.insertAuditLog(
      "DELETE",
      "products",
      id,
      userId,
      before,
      after ?? before,
      meta,
    );
  }

  async adjustStock(
    productId: string,
    input: StockAdjustInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<StockAdjustResponse> {
    if (
      (input.type === "IN" || input.type === "OUT") &&
      input.quantity <= 0
    ) {
      throw new BadRequestError(
        "Quantity must be positive for IN/OUT movement",
      );
    }

    try {
      const result = await this.db.transaction(async (tx) => {
        return this.repo.adjustStock({
          productId,
          type: input.type,
          quantity: input.quantity,
          referenceType: input.referenceType ?? null,
          referenceId: input.referenceId ?? null,
          createdBy: userId,
          note: input.note ?? null,
        }, tx);
      });

      await this.redis.del(DASHBOARD_CACHE_KEY);

      this.auditService.insertAuditLog(
        "UPDATE",
        "products",
        productId,
        userId,
        null,
        { type: input.type, quantity: input.quantity, note: input.note ?? null },
        meta,
      );

      return {
        product: this.toProductResponse(result.product),
        movement: this.toMovementResponse(result.movement),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "PRODUCT_NOT_FOUND") {
        throw new NotFoundError("Product not found");
      }
      if (message === "INSUFFICIENT_STOCK") {
        throw new BadRequestError("Insufficient stock");
      }
      throw err;
    }
  }

  async filterCategories(
    input: FilterRequestInput,
  ): Promise<{ data: CategoryResponse[]; pagination: PaginationResponse }> {
    const result = await this.repo.findCategoriesFiltered(input);
    const pagination = calculatePagination(input.page, input.pageSize, result.total);

    return {
      data: result.data.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        version: c.version,
      })),
      pagination,
    };
  }

  async listCategories(): Promise<CategoryResponse[]> {
    const categories = await this.repo.findAllCategories();
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      version: c.version,
    }));
  }

  async createCategory(
    input: CreateCategoryInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<CategoryResponse> {
    const entity = await this.repo.createCategory({
      id: uuidv4(),
      name: input.name,
      description: input.description ?? null,
    });

    this.auditService.insertAuditLog("CREATE", "categories", entity.id, userId, null, entity, meta);

    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      version: entity.version,
    };
  }

  async updateCategory(
    id: string,
    input: UpdateCategoryInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<CategoryResponse> {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) throw new NotFoundError("Category not found");

    const { version, ...fields } = input;
    const updated = await this.repo.updateCategory(id, fields, version);
    if (!updated) throw new ConflictError("Version mismatch");

    this.auditService.insertAuditLog("UPDATE", "categories", id, userId, existing, updated, meta);

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      version: updated.version,
    };
  }

  async deleteCategory(
    id: string,
    input: DeleteCategoryInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<void> {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) throw new NotFoundError("Category not found");

    const deleted = await this.repo.deleteCategory(id, input.version);
    if (!deleted) throw new ConflictError("Version mismatch");

    this.auditService.insertAuditLog("DELETE", "categories", id, userId, existing, null, meta);
  }

  private toProductResponse(entity: ProductEntity): ProductResponse {
    return {
      id: entity.id,
      categoryId: entity.categoryId,
      categoryName: entity.categoryName ?? '',
      sku: entity.sku,
      name: entity.name,
      description: entity.description,
      unit: entity.unit,
      costPrice: entity.costPrice,
      sellPrice: entity.sellPrice,
      minStock: entity.minStock,
      currentStock: entity.currentStock,
      version: entity.version,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt),
      updatedAt:
        entity.updatedAt instanceof Date
          ? entity.updatedAt.toISOString()
          : String(entity.updatedAt),
    };
  }

  private toMovementResponse(
    entity: StockMovementEntity,
  ): StockMovementResponse {
    return {
      id: entity.id,
      productId: entity.productId,
      type: entity.type,
      quantity: entity.quantity,
      referenceType: entity.referenceType,
      referenceId: entity.referenceId,
      createdBy: entity.createdBy,
      note: entity.note,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt),
    };
  }
}
