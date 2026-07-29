jest.mock("uuid", () => ({ v4: () => "mocked-uuid-product" }));

import Redis from "ioredis";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { InventoryService } from "./service";
import type { IInventoryRepository } from "./repo";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../shared/errors/AppError";

const mockProduct = {
  id: "prod-1",
  categoryId: "cat-1",
  sku: "GS-001",
  name: "ถังแก๊ส NGV 60L",
  description: "ถังแก๊ส NGV ขนาด 60 ลิตร",
  unit: "piece",
  costPrice: "3500.00",
  sellPrice: "5000.00",
  minStock: 5,
  currentStock: 10,
  version: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  deletedAt: null,
};

const mockMovement = {
  id: "mov-1",
  productId: "prod-1",
  type: "IN" as const,
  quantity: 5,
  referenceType: null,
  referenceId: null,
  createdBy: "user-1",
  note: null,
  createdAt: new Date("2026-01-02"),
};

const mockCategory = {
  id: "cat-1",
  name: "ถังแก๊ส",
  description: null,
  version: 1,
};

describe("InventoryService", () => {
  let repo: jest.Mocked<IInventoryRepository>;
  let db: MySql2Database;
  let redis: jest.Mocked<Redis>;
  let svc: InventoryService;
  const mockAuditService = { Insert: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      FindFiltered: jest.fn(),
      FindById: jest.fn(),
      FindByIdWithMovements: jest.fn(),
      FindByIds: jest.fn(),
      FindBySku: jest.fn(),
      FindAllCategories: jest.fn(),
      FindCategoriesFiltered: jest.fn(),
      FindCategoryById: jest.fn(),
      CreateCategory: jest.fn(),
      UpdateCategory: jest.fn(),
      DeleteCategory: jest.fn(),
      Create: jest.fn(),
      Update: jest.fn(),
      SoftDelete: jest.fn(),
      AdjustStock: jest.fn(),
    };
    db = {
      transaction: jest.fn((fn: (tx: unknown) => unknown) => fn({})),
    } as unknown as MySql2Database;
    redis = { del: jest.fn() } as unknown as jest.Mocked<Redis>;
    svc = new InventoryService(repo, db, redis, mockAuditService as any);
  });

  describe("filter", () => {
    it("should return paginated products", async () => {
      repo.FindFiltered.mockResolvedValue({
        data: [mockProduct],
        total: 1,
      });

      const result = await svc.Filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].sku).toBe("GS-001");
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalData).toBe(1);
    });

    it("should return empty list when no products", async () => {
      repo.FindFiltered.mockResolvedValue({ data: [], total: 0 });

      const result = await svc.Filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("should calculate multi-page pagination", async () => {
      repo.FindFiltered.mockResolvedValue({ data: [], total: 55 });

      const result = await svc.Filter({
        page: 2,
        pageSize: 20,
        sortBy: "asc",
        filters: [],
      });

      expect(result.pagination.totalPage).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });
  });

  describe("getById", () => {
    it("should throw NotFoundError when product not found", async () => {
      repo.FindByIdWithMovements.mockResolvedValue(null);

      await expect(svc.GetById("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("should return product with movements", async () => {
      repo.FindByIdWithMovements.mockResolvedValue({
        product: mockProduct,
        movements: [mockMovement],
      });

      const result = await svc.GetById("prod-1");

      expect(result.sku).toBe("GS-001");
      expect(result.movements).toHaveLength(1);
      expect(result.movements[0].type).toBe("IN");
    });

    it("should return product with empty movements", async () => {
      repo.FindByIdWithMovements.mockResolvedValue({
        product: mockProduct,
        movements: [],
      });

      const result = await svc.GetById("prod-1");

      expect(result.movements).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should throw when sku already exists", async () => {
      repo.FindBySku.mockResolvedValue(mockProduct);

      await expect(
        svc.Create({
          categoryId: "cat-1",
          sku: "GS-001",
          name: "ถังแก๊ส",
          unit: "piece",
          costPrice: 3500,
          sellPrice: 5000,
          minStock: 5,
          currentStock: 10,
        }, "user-1"),
      ).rejects.toThrow("SKU already exists");
    });

    it("should create product with generated id", async () => {
      repo.FindBySku.mockResolvedValue(null);
      repo.Create.mockResolvedValue(mockProduct);

      const result = await svc.Create({
        categoryId: "cat-1",
        sku: "GS-001",
        name: "ถังแก๊ส NGV 60L",
        unit: "piece",
        costPrice: 3500,
        sellPrice: 5000,
        minStock: 5,
        currentStock: 10,
      }, "user-1");

      expect(result.sku).toBe("GS-001");
      expect(result.version).toBe(1);
      expect(repo.Create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mocked-uuid-product",
          sku: "GS-001",
          version: 1,
          costPrice: "3500",
          sellPrice: "5000",
        }),
      );
    });

    it("should create product with defaults", async () => {
      repo.FindBySku.mockResolvedValue(null);
      repo.Create.mockResolvedValue({
        ...mockProduct,
        unit: "piece",
        description: null,
        costPrice: "0",
        sellPrice: "0",
        currentStock: 0,
        minStock: 0,
        sku: "NEW-001",
      });

      const result = await svc.Create({
        categoryId: "cat-1",
        sku: "NEW-001",
        name: "New Product",
        unit: "piece",
        costPrice: 0,
        sellPrice: 0,
        minStock: 0,
        currentStock: 0,
      }, "user-1");

      expect(result.unit).toBe("piece");
      expect(result.costPrice).toBe("0");
    });
  });

  describe("update", () => {
    it("should throw ConflictError on version mismatch", async () => {
      repo.FindById.mockResolvedValue(mockProduct);
      repo.FindBySku.mockResolvedValue(null);
      repo.Update.mockResolvedValue(null);

      await expect(
        svc.Update("prod-1", {
          name: "Updated Name",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(ConflictError);
    });

    it("should throw when updated sku conflicts", async () => {
      repo.FindById.mockResolvedValue(mockProduct);
      repo.FindBySku.mockResolvedValue({ ...mockProduct, id: "prod-2" });

      await expect(
        svc.Update("prod-1", {
          sku: "GS-001",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow("SKU already exists");
    });

    it("should update product successfully", async () => {
      repo.FindById.mockResolvedValue(mockProduct);
      repo.FindBySku.mockResolvedValue(null);
      const updatedProduct = {
        ...mockProduct,
        name: "Updated Name",
        version: 2,
      };
      repo.Update.mockResolvedValue(updatedProduct);

      const result = await svc.Update("prod-1", {
        name: "Updated Name",
        version: 1,
      }, "user-1");

      expect(result.name).toBe("Updated Name");
      expect(repo.Update).toHaveBeenCalledWith(
        "prod-1",
        expect.objectContaining({ name: "Updated Name" }),
        1,
      );
    });

    it("should allow updating with same sku", async () => {
      repo.FindById.mockResolvedValue(mockProduct);
      repo.FindBySku.mockResolvedValue(mockProduct);
      repo.Update.mockResolvedValue({ ...mockProduct, version: 2 });

      const result = await svc.Update("prod-1", {
        sku: "GS-001",
        version: 1,
      }, "user-1");

      expect(result.sku).toBe("GS-001");
    });
  });

  describe("softDelete", () => {
    it("should throw ConflictError on version mismatch", async () => {
      repo.FindById.mockResolvedValue(mockProduct);
      repo.SoftDelete.mockResolvedValue(false);

      await expect(svc.SoftDelete("prod-1", { version: 1 }, "user-1")).rejects.toThrow(
        ConflictError,
      );
    });

    it("should soft delete product successfully", async () => {
      repo.FindById
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({ ...mockProduct, deletedAt: new Date() });
      repo.SoftDelete.mockResolvedValue(true);

      await expect(
        svc.SoftDelete("prod-1", { version: 1 }, "user-1"),
      ).resolves.toBeUndefined();

      expect(repo.SoftDelete).toHaveBeenCalledWith("prod-1", 1);
    });
  });

  describe("adjustStock", () => {
    it("should throw BadRequestError for zero quantity IN movement", async () => {
      await expect(
        svc.AdjustStock(
          "prod-1",
          { type: "IN", quantity: 0 },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for negative quantity OUT movement", async () => {
      await expect(
        svc.AdjustStock(
          "prod-1",
          { type: "OUT", quantity: -1 },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("should adjust stock IN successfully", async () => {
      repo.AdjustStock.mockResolvedValue({
        product: { ...mockProduct, currentStock: 15 },
        movement: { ...mockMovement, type: "IN", quantity: 5 },
      });

      const result = await svc.AdjustStock(
        "prod-1",
        { type: "IN", quantity: 5, note: "เติมสต็อก" },
        "user-1",
      );

      expect(result.product.currentStock).toBe(15);
      expect(result.movement.type).toBe("IN");
      expect(result.movement.quantity).toBe(5);
      expect(repo.AdjustStock).toHaveBeenCalledWith({
        productId: "prod-1",
        type: "IN",
        quantity: 5,
        referenceType: null,
        referenceId: null,
        createdBy: "user-1",
        note: "เติมสต็อก",
      }, expect.any(Object));
    });

    it("should adjust stock OUT successfully", async () => {
      repo.AdjustStock.mockResolvedValue({
        product: { ...mockProduct, currentStock: 7 },
        movement: { ...mockMovement, type: "OUT", quantity: 3 },
      });

      const result = await svc.AdjustStock(
        "prod-1",
        { type: "OUT", quantity: 3 },
        "user-1",
      );

      expect(result.product.currentStock).toBe(7);
      expect(result.movement.type).toBe("OUT");
    });

    it("should adjust stock (absolute) successfully", async () => {
      repo.AdjustStock.mockResolvedValue({
        product: { ...mockProduct, currentStock: 100 },
        movement: { ...mockMovement, type: "ADJUST", quantity: 100 },
      });

      const result = await svc.AdjustStock(
        "prod-1",
        { type: "ADJUST", quantity: 100 },
        "user-1",
      );

      expect(result.product.currentStock).toBe(100);
      expect(result.movement.type).toBe("ADJUST");
    });

    it("should throw NotFoundError when product not found in transaction", async () => {
      repo.AdjustStock.mockRejectedValue(new Error("PRODUCT_NOT_FOUND"));

      await expect(
        svc.AdjustStock(
          "nonexistent",
          { type: "IN", quantity: 5 },
          "user-1",
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError for insufficient stock", async () => {
      repo.AdjustStock.mockRejectedValue(new Error("INSUFFICIENT_STOCK"));

      await expect(
        svc.AdjustStock(
          "prod-1",
          { type: "OUT", quantity: 999 },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("listCategories", () => {
    it("should return all categories", async () => {
      repo.FindAllCategories.mockResolvedValue([mockCategory]);

      const result = await svc.ListCategories();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("ถังแก๊ส");
    });

    it("should return empty array when no categories", async () => {
      repo.FindAllCategories.mockResolvedValue([]);

      const result = await svc.ListCategories();

      expect(result).toHaveLength(0);
    });
  });
});
